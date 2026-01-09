import { ConfigService } from '@nestjs/config';
import { UploadDatasetDto } from './dto/upload-dataset.dto';
import { AnalysisService } from './analysis.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { DatasetEntity } from './entities/dataset.entity';
export declare class DatasetsService {
    private readonly supabase;
    private readonly analysisService;
    private readonly configService;
    private readonly maxRowsForPreview;
    private dataCache;
    constructor(supabase: SupabaseClient, analysisService: AnalysisService, configService: ConfigService);
    private readonly tableName;
    create(ownerId: string, dto: UploadDatasetDto): Promise<DatasetEntity>;
    uploadDataset(ownerId: string, datasetId: string, file: Express.Multer.File): Promise<DatasetEntity>;
    update(ownerId: string, datasetId: string, dto: Partial<UploadDatasetDto>): Promise<DatasetEntity>;
    findAll(ownerId: string, skip?: number, limit?: number): Promise<DatasetEntity[]>;
    countByUser(ownerId: string): Promise<number>;
    findOne(ownerId: string, datasetId: string): Promise<DatasetEntity>;
    getPreview(datasetId: string, limit?: number): Promise<Record<string, unknown>[]>;
    remove(ownerId: string, datasetId: string): Promise<void>;
    private resolveExtension;
    private parseFile;
    private toEntity;
}
