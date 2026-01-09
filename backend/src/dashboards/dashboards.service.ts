import { Inject, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { DatasetsService } from '../datasets/datasets.service';
import { SUPABASE_CLIENT } from '../database/supabase.constants';
import { SupabaseClient } from '@supabase/supabase-js';
import { DashboardEntity, DashboardChartEntity } from './entities/dashboard.entity';

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

@Injectable()
export class DashboardsService {
  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
    private readonly datasetsService: DatasetsService,
  ) { }

  private readonly tableName = 'dashboards';

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
}
