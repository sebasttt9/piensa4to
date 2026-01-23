import { Inject, Injectable, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { DatasetsService } from '../datasets/datasets.service';
import { SUPABASE_DATA_CLIENT } from '../database/supabase.constants';
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
    @Inject(SUPABASE_DATA_CLIENT)
    private readonly supabase: SupabaseClient,
    private readonly datasetsService: DatasetsService,
  ) { }

  private readonly tableName = 'dashboards';
  private readonly shareTableName = 'dashboard_shares';

  async create(ownerId: string, dto: CreateDashboardDto): Promise<DashboardEntity> {
    if (dto.datasetIds && dto.datasetIds.length > 0) {
      for (const datasetId of dto.datasetIds) {
        await this.datasetsService.findOne(ownerId, datasetId);
      }
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        owner_id: ownerId,
        name: dto.name,
        description: dto.description ?? null,
        dataset_ids: dto.datasetIds ?? [],
        layout: {},
        charts: [],
        is_public: false,
      })
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo crear el dashboard');
    }

    if (!data) {
      throw new InternalServerErrorException('No se pudo crear el dashboard');
    }

    return this.toEntity(data as DashboardRow);
  }

  async findAll(
    ownerId: string,
    skip = 0,
    limit = 10,
  ): Promise<DashboardEntity[]> {
    const rangeStart = skip;
    const rangeEnd = skip + limit - 1;

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('owner_id', ownerId)
      .order('updated_at', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (error) {
      throw new InternalServerErrorException('No se pudieron listar los dashboards');
    }

    return ((data ?? []) as DashboardRow[]).map((row) => this.toEntity(row));
  }

  async countByUser(ownerId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', ownerId);

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

    return this.toEntity(data as DashboardRow);
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

    if (datasetIds) {
      updatePayload.dataset_ids = datasetIds;
    }

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

    return this.toEntity(data as DashboardRow);
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

    return this.toEntity(data as DashboardRow);
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

  private toEntity(row: DashboardRow): DashboardEntity {
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      description: row.description ?? undefined,
      datasetIds: row.dataset_ids ?? [],
      layout: row.layout ?? {},
      charts: row.charts ?? [],
      isPublic: row.is_public,
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
}
