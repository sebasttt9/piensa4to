import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Dataset, DatasetDocument } from './schemas/dataset.schema';
import { UploadDatasetDto } from './dto/upload-dataset.dto';
import { AnalysisService } from './analysis.service';

@Injectable()
export class DatasetsService {
  private readonly maxRowsForPreview = 1000;
  private dataCache = new Map<string, Record<string, unknown>[]>();

  constructor(
    @InjectModel(Dataset.name)
    private readonly datasetModel: Model<DatasetDocument>,
    private readonly analysisService: AnalysisService,
    private readonly configService: ConfigService,
  ) { }

  async create(
    ownerId: string,
    dto: UploadDatasetDto,
  ): Promise<DatasetDocument> {
    const document = new this.datasetModel({
      owner: new Types.ObjectId(ownerId),
      name: dto.name,
      description: dto.description,
      status: 'pending',
    });

    return document.save();
  }

  async uploadDataset(
    ownerId: string,
    datasetId: string,
    file: Express.Multer.File,
  ): Promise<DatasetDocument> {
    if (!file) {
      throw new BadRequestException('Debe adjuntar un archivo CSV o Excel.');
    }

    const dataset = await this.findOne(ownerId, datasetId);
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
    dataset.filename = file.originalname;
    dataset.fileSize = file.size;
    dataset.fileType = extension;
    dataset.rowCount = rows.length;
    dataset.columnCount = columns.length;
    dataset.preview = rows.slice(0, previewLimit);
    dataset.status = 'processed';

    return dataset.save();
  }

  async update(
    ownerId: string,
    datasetId: string,
    dto: Partial<UploadDatasetDto>,
  ): Promise<DatasetDocument> {
    const dataset = await this.findOne(ownerId, datasetId);

    if (dto.name) {
      dataset.name = dto.name;
    }
    if (dto.description !== undefined) {
      dataset.description = dto.description;
    }

    return dataset.save();
  }

  async findAll(
    ownerId: string,
    skip = 0,
    limit = 10,
  ): Promise<DatasetDocument[]> {
    return this.datasetModel
      .find({ owner: ownerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countByUser(ownerId: string): Promise<number> {
    return this.datasetModel.countDocuments({ owner: ownerId });
  }

  async findOne(ownerId: string, datasetId: string): Promise<DatasetDocument> {
    const dataset = await this.datasetModel
      .findOne({ _id: datasetId, owner: ownerId })
      .exec();

    if (!dataset) {
      throw new NotFoundException('Dataset no encontrado');
    }

    return dataset;
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

    const dataset = await this.datasetModel.findById(datasetId);
    return dataset?.preview?.slice(0, limit) || [];
  }

  async remove(ownerId: string, datasetId: string): Promise<void> {
    const result = await this.datasetModel.deleteOne({
      _id: datasetId,
      owner: ownerId,
    });

    if (!result.deletedCount) {
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
}
