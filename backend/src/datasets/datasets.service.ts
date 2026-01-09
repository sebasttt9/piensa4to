import { Inject, Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { UploadDatasetDto } from './dto/upload-dataset.dto';
import { AnalysisService } from './analysis.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../database/supabase.constants';
import { DatasetAnalysis } from './interfaces/dataset-analysis.interface';
import { DatasetEntity } from './entities/dataset.entity';

interface DatasetRow {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  filename: string | null;
  file_size: number | null;
  file_type: 'csv' | 'xlsx' | null;
  row_count: number | null;
  column_count: number | null;
  analysis: DatasetAnalysis | null;
  preview: Record<string, unknown>[] | null;
  status: 'pending' | 'processed' | 'error';
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class DatasetsService {
  private readonly maxRowsForPreview = 1000;
  private dataCache = new Map<string, Record<string, unknown>[]>();

  constructor(
    @Inject(SUPABASE_CLIENT)
    private readonly supabase: SupabaseClient,
    private readonly analysisService: AnalysisService,
    private readonly configService: ConfigService,
  ) { }

  private readonly tableName = 'datasets';

  async create(
    ownerId: string,
    dto: UploadDatasetDto,
  ): Promise<DatasetEntity> {
    if (!dto.name) {
      throw new BadRequestException('El nombre del dataset es obligatorio');
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert({
        owner_id: ownerId,
        name: dto.name,
        description: dto.description ?? null,
        status: 'pending',
        tags: dto.tags ?? [],
        preview: [],
      })
      .select('*')
      .single();

    if (error) {
      throw new InternalServerErrorException('No se pudo crear el dataset');
    }

    return this.toEntity(data);
  }

  async uploadDataset(
    ownerId: string,
    datasetId: string,
    file: Express.Multer.File,
  ): Promise<DatasetEntity> {
    if (!file) {
      throw new BadRequestException('Debe adjuntar un archivo CSV o Excel.');
    }

    await this.findOne(ownerId, datasetId);
    const extension = this.resolveExtension(file.originalname);
    const rows = await this.parseFile(file, extension);

    if (rows.length === 0) {
      throw new BadRequestException('El archivo no contiene registros.');
    }

    const previewLimit = this.configService.get<number>('uploads.previewLimit', 50) ?? 50;
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    // Cache the full data for analysis
    this.dataCache.set(datasetId, rows);

    // Update dataset
    const preview = rows.slice(0, previewLimit);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update({
        filename: file.originalname,
        file_size: file.size,
        file_type: extension,
        row_count: rows.length,
        column_count: columns.length,
        preview,
        status: 'processed',
      })
      .eq('id', datasetId)
      .eq('owner_id', ownerId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el dataset');
    }

    if (!data) {
      throw new NotFoundException('Dataset no encontrado');
    }

    return this.toEntity(data);
  }

  async update(
    ownerId: string,
    datasetId: string,
    dto: Partial<UploadDatasetDto>,
  ): Promise<DatasetEntity> {
    await this.findOne(ownerId, datasetId);

    const payload: Record<string, unknown> = {};
    if (dto.name !== undefined) {
      payload.name = dto.name;
    }
    if (dto.description !== undefined) {
      payload.description = dto.description;
    }
    if (dto.tags !== undefined) {
      payload.tags = dto.tags;
    }

    if (Object.keys(payload).length === 0) {
      return this.findOne(ownerId, datasetId);
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(payload)
      .eq('id', datasetId)
      .eq('owner_id', ownerId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo actualizar el dataset');
    }

    if (!data) {
      throw new NotFoundException('Dataset no encontrado');
    }

    return this.toEntity(data);
  }

  async findAll(
    ownerId: string,
    skip = 0,
    limit = 10,
  ): Promise<DatasetEntity[]> {
    const rangeStart = skip;
    const rangeEnd = skip + limit - 1;

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (error) {
      throw new InternalServerErrorException('No se pudieron listar los datasets');
    }

    return (data ?? []).map((row) => this.toEntity(row));
  }

  async countByUser(ownerId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', ownerId);

    if (error) {
      throw new InternalServerErrorException('No se pudo contar los datasets');
    }

    return count ?? 0;
  }

  async findOne(ownerId: string, datasetId: string): Promise<DatasetEntity> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', datasetId)
      .eq('owner_id', ownerId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo obtener el dataset');
    }

    if (!data) {
      throw new NotFoundException('Dataset no encontrado');
    }

    return this.toEntity(data);
  }

  async getPreview(
    datasetId: string,
    limit = 50,
  ): Promise<Record<string, unknown>[]> {
    // Return cached preview or from database
    const cached = this.dataCache.get(datasetId);
    if (cached) {
      return cached.slice(0, limit);
    }

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('preview')
      .eq('id', datasetId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo obtener la vista previa');
    }

    const preview = data?.preview ?? [];
    return preview.slice(0, limit);
  }

  async remove(ownerId: string, datasetId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', datasetId)
      .eq('owner_id', ownerId)
      .select('id')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException('No se pudo eliminar el dataset');
    }

    if (!data) {
      throw new NotFoundException('Dataset no encontrado');
    }

    // Clear cache
    this.dataCache.delete(datasetId);
  }

  private resolveExtension(fileName: string): 'csv' | 'xlsx' {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.csv')) {
      return 'csv';
    }
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      return 'xlsx';
    }
    throw new BadRequestException('Formato no soportado. Use CSV o Excel.');
  }

  private async parseFile(
    file: Express.Multer.File,
    extension: 'csv' | 'xlsx',
  ): Promise<Record<string, unknown>[]> {
    if (extension === 'csv') {
      const content = file.buffer.toString('utf-8');
      const parsed = Papa.parse<Record<string, unknown>>(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      });

      if (parsed.errors.length > 0) {
        throw new BadRequestException(
          `Error al procesar CSV: ${parsed.errors[0].message}`,
        );
      }

      return parsed.data;
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return [];
    }
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      raw: true,
    });

    return data;
  }

  private toEntity(row: DatasetRow): DatasetEntity {
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      description: row.description ?? undefined,
      filename: row.filename ?? undefined,
      fileSize: row.file_size ?? undefined,
      fileType: row.file_type ?? undefined,
      rowCount: row.row_count ?? undefined,
      columnCount: row.column_count ?? undefined,
      analysis: row.analysis ?? undefined,
      preview: row.preview ?? [],
      status: row.status,
      tags: row.tags ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
