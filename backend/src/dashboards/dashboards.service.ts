import { Inject, Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { DatasetsService } from '../datasets/datasets.service';
import { SUPABASE_CLIENT } from '../database/supabase.constants';
import { SupabaseClient } from '@supabase/supabase-js';
import { DashboardEntity, DashboardChartEntity } from './entities/dashboard.entity';
import { ShareDashboardDto, ShareChannel } from './dto/share-dashboard.dto';
import PDFDocument from 'pdfkit';

interface DashboardRow {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  dataset_ids: string[] | null;
  layout: Record<string, unknown> | null;
  charts: DashboardChartEntity[] | null;
  is_public: boolean;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface DashboardShareRow {
  id: string;
  dashboard_id: string;
  owner_id: string;
  channel: ShareChannel;
  contact: string;
  message: string | null;
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
}

interface DashboardDatasetRow {
  dashboard_id: string;
  dataset_id: string;
}

export interface DashboardShareEntity {
  id: string;
  dashboardId: string;
  ownerId: string;
  channel: ShareChannel;
  contact: string;
  message?: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
}

@Injectable()
export class DashboardsService {
  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
    private readonly datasetsService: DatasetsService,
  ) { }

  private readonly tableName = 'dashboards';
  private readonly shareTableName = 'dashboard_shares';
  private readonly datasetsJoinTable = 'dashboard_datasets';

  async create(ownerId: string, dto: CreateDashboardDto, userRole: string = 'user'): Promise<DashboardEntity> {
    if (dto.datasetIds && dto.datasetIds.length > 0) {
      for (const datasetId of dto.datasetIds) {
        await this.datasetsService.findOne(ownerId, datasetId);
      }
    }

    // Determine initial status based on user role
    const initialStatus = userRole === 'admin' || userRole === 'superadmin' ? 'approved' : 'pending';

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        owner_id: ownerId,
        name: dto.name,
        description: dto.description ?? null,
        layout: {},
        charts: [],
        is_public: false,
        status: initialStatus,
        approved_by: initialStatus === 'approved' ? ownerId : null,
        approved_at: initialStatus === 'approved' ? new Date().toISOString() : null,
      })
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo crear el dashboard');
    }

    if (!data) {
      throw new InternalServerErrorException('No se pudo crear el dashboard');
    }

    await this.replaceDashboardDatasets((data as DashboardRow).id, dto.datasetIds ?? []);

    const datasets = await this.collectDatasetIds([(data as DashboardRow).id]);

    return this.toEntity(data as DashboardRow, datasets.get((data as DashboardRow).id));
  }

  async findAll(
    ownerId: string,
    userRole: string = 'user',
    skip = 0,
    limit = 10,
  ): Promise<DashboardEntity[]> {
    const rangeStart = skip;
    const rangeEnd = skip + limit - 1;

    let query = this.supabase
      .from(this.tableName)
      .select('*')
      .order('updated_at', { ascending: false })
      .range(rangeStart, rangeEnd);

    // Filter based on user role
    if (userRole === 'admin' || userRole === 'superadmin') {
      // Admins can see all dashboards
      // No additional filter needed
    } else {
      // Regular users can only see their own dashboards or public dashboards
      query = query.or(`owner_id.eq.${ownerId},is_public.eq.true`);
    }

    const { data, error } = await query;

    if (error) {
      throw new InternalServerErrorException('No se pudieron listar los dashboards');
    }

    const rows = (data ?? []) as DashboardRow[];
    const datasets = await this.collectDatasetIds(rows.map((row) => row.id));

    return rows.map((row) => this.toEntity(row, datasets.get(row.id)));
  }

  async countByUser(ownerId: string, userRole: string = 'user'): Promise<number> {
    let query = this.supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true });

    // Filter based on user role
    if (userRole === 'admin' || userRole === 'superadmin') {
      // Admins can see all dashboards
      // No additional filter needed
    } else {
      // Regular users can only see their own dashboards or public dashboards
      query = query.or(`owner_id.eq.${ownerId},is_public.eq.true`);
    }

    const { count, error } = await query;

    if (error) {
      throw new InternalServerErrorException('No se pudo contar los dashboards');
    }

    return count ?? 0;
  }

  async findOne(ownerId: string, id: string): Promise<DashboardEntity> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo obtener el dashboard');
    }

    if (!data) {
      throw new NotFoundException('Dashboard no encontrado');
    }

    const datasets = await this.collectDatasetIds([(data as DashboardRow).id]);

    return this.toEntity(data as DashboardRow, datasets.get((data as DashboardRow).id));
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateDashboardDto,
  ): Promise<DashboardEntity> {
    const { datasetIds, ...rest } = dto;

    // Validate new dataset ownership
    if (datasetIds && datasetIds.length > 0) {
      for (const datasetId of datasetIds) {
        await this.datasetsService.findOne(ownerId, datasetId);
      }
    }


    const updatePayload: Record<string, unknown> = { ...rest };

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updatePayload)
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el dashboard');
    }

    if (!data) {
      throw new NotFoundException('Dashboard no encontrado');
    }

    await this.replaceDashboardDatasets(id, datasetIds ?? []);

    const datasets = await this.collectDatasetIds([id]);

    return this.toEntity(data as DashboardRow, datasets.get(id));
  }

  async share(
    ownerId: string,
    id: string,
    isPublic: boolean,
  ): Promise<DashboardEntity> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({ is_public: isPublic })
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo compartir el dashboard');
    }

    if (!data) {
      throw new NotFoundException('Dashboard no encontrado');
    }

    const datasets = await this.collectDatasetIds([(data as DashboardRow).id]);

    return this.toEntity(data as DashboardRow, datasets.get((data as DashboardRow).id));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo eliminar el dashboard');
    }

    if (!data) {
      throw new NotFoundException('Dashboard no encontrado');
    }
  }

  async shareWithContact(
    ownerId: string,
    id: string,
    dto: ShareDashboardDto,
  ): Promise<DashboardShareEntity> {
    const dashboard = await this.findOne(ownerId, id);

    const contact = dto.contact.trim();
    if (dto.channel === ShareChannel.EMAIL) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact)) {
        throw new BadRequestException('El correo electrónico no es válido');
      }
    }

    if (dto.channel === ShareChannel.SMS) {
      const phoneRegex = /^[+]?\d[\d\s-]{7,15}$/;
      if (!phoneRegex.test(contact)) {
        throw new BadRequestException('El número de teléfono no es válido');
      }
    }

    const { data, error } = await this.supabase
      .from(this.shareTableName)
      .insert({
        dashboard_id: dashboard.id,
        owner_id: ownerId,
        channel: dto.channel,
        contact,
        message: dto.message ?? null,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new InternalServerErrorException('No se pudo registrar la invitación de compartido');
    }

    if (dto.makePublic === true && !dashboard.isPublic) {
      await this.share(ownerId, id, true);
    }

    return this.toShareEntity(data as DashboardShareRow);
  }

  async export(
    ownerId: string,
    id: string,
    format: 'pdf' | 'json',
  ): Promise<DashboardEntity | Buffer> {
    const dashboard = await this.findOne(ownerId, id);

    if (format === 'json') {
      return dashboard;
    }

    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    const completion = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (error) => reject(error));
    });

    doc.fontSize(20).text(dashboard.name, { underline: false });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#4b5563').text(`Última actualización: ${new Date(dashboard.updatedAt).toLocaleString('es-ES')}`);
    doc.moveDown(1);

    if (dashboard.description) {
      doc.fontSize(12).fillColor('#0f172a').text(dashboard.description, {
        align: 'left',
      });
      doc.moveDown(1);
    }

    doc.fillColor('#1f2937').fontSize(14).text('Datasets asociados', { underline: true });
    doc.moveDown(0.5);

    if (dashboard.datasetIds.length === 0) {
      doc.fontSize(12).fillColor('#475569').text('Sin datasets vinculados.');
    } else {
      dashboard.datasetIds.forEach((datasetId, index) => {
        doc.fontSize(12).fillColor('#1f2937').text(`${index + 1}. ${datasetId}`);
      });
    }

    doc.moveDown(1);
    doc.fillColor('#1f2937').fontSize(14).text('Visualizaciones', { underline: true });
    doc.moveDown(0.5);

    if (dashboard.charts.length === 0) {
      doc.fontSize(12).fillColor('#475569').text('Sin visualizaciones registradas.');
    } else {
      dashboard.charts.forEach((chart, index) => {
        doc.fontSize(12).fillColor('#1f2937').text(`${index + 1}. ${chart.type}`);
        doc.fontSize(10).fillColor('#475569').text(JSON.stringify(chart.config ?? {}, null, 2), {
          align: 'left',
        });
        doc.moveDown(0.5);
      });
    }

    doc.end();
    return completion;
  }

  private toEntity(row: DashboardRow, datasetIds?: string[]): DashboardEntity {
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      description: row.description ?? undefined,
      datasetIds: datasetIds ?? row.dataset_ids ?? [],
      layout: row.layout ?? {},
      charts: row.charts ?? [],
      isPublic: row.is_public,
      status: row.status,
      approvedBy: row.approved_by ?? undefined,
      approvedAt: row.approved_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toShareEntity(row: DashboardShareRow): DashboardShareEntity {
    return {
      id: row.id,
      dashboardId: row.dashboard_id,
      ownerId: row.owner_id,
      channel: row.channel,
      contact: row.contact,
      message: row.message ?? undefined,
      status: row.status,
      createdAt: row.created_at,
    };
  }

  private async replaceDashboardDatasets(dashboardId: string, datasetIds: string[]): Promise<void> {
    const { error: deleteError } = await this.supabase
      .from(this.datasetsJoinTable)
      .delete()
      .eq('dashboard_id', dashboardId);

    if (deleteError) {
      throw new InternalServerErrorException('No se pudieron actualizar los datasets del dashboard');
    }

    if (!datasetIds || datasetIds.length === 0) {
      return;
    }

    const records = datasetIds.map((datasetId) => ({
      dashboard_id: dashboardId,
      dataset_id: datasetId,
    }));

    const { error: insertError } = await this.supabase
      .from(this.datasetsJoinTable)
      .insert(records);

    if (insertError) {
      throw new InternalServerErrorException('No se pudieron vincular los datasets al dashboard');
    }
  }

  private async collectDatasetIds(dashboardIds: string[]): Promise<Map<string, string[]>> {
    const result = new Map<string, string[]>();

    if (!dashboardIds || dashboardIds.length === 0) {
      return result;
    }

    const { data, error } = await this.supabase
      .from(this.datasetsJoinTable)
      .select('dashboard_id, dataset_id')
      .in('dashboard_id', dashboardIds);

    if (error) {
      throw new InternalServerErrorException('No se pudieron obtener los datasets asociados al dashboard');
    }

    (data as DashboardDatasetRow[] | null)?.forEach((row) => {
      if (!result.has(row.dashboard_id)) {
        result.set(row.dashboard_id, []);
      }

      result.get(row.dashboard_id)!.push(row.dataset_id);
    });

    dashboardIds.forEach((dashboardId) => {
      if (!result.has(dashboardId)) {
        result.set(dashboardId, []);
      }
    });

    return result;
  }

  async approveDashboard(ownerId: string, dashboardId: string, status: 'approved' | 'rejected'): Promise<DashboardEntity> {
    // First check if the user has permission to approve (admin or superadmin)
    // This will be checked in the controller with guards

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        status,
        approved_by: ownerId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', dashboardId)
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el status del dashboard');
    }

    if (!data) {
      throw new NotFoundException('Dashboard no encontrado');
    }

    const datasets = await this.collectDatasetIds([dashboardId]);
    return this.toEntity(data as DashboardRow, datasets.get(dashboardId));
  }
}
