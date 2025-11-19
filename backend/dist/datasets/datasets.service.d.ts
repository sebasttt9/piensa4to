import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { DatasetDocument } from './schemas/dataset.schema';
import { UploadDatasetDto } from './dto/upload-dataset.dto';
import { AnalysisService } from './analysis.service';
export declare class DatasetsService {
    private readonly datasetModel;
    private readonly analysisService;
    private readonly configService;
    private readonly maxRowsForPreview;
    private dataCache;
    constructor(datasetModel: Model<DatasetDocument>, analysisService: AnalysisService, configService: ConfigService);
    create(ownerId: string, dto: UploadDatasetDto): Promise<DatasetDocument>;
    uploadDataset(ownerId: string, datasetId: string, file: Express.Multer.File): Promise<DatasetDocument>;
    update(ownerId: string, datasetId: string, dto: Partial<UploadDatasetDto>): Promise<DatasetDocument>;
    findAll(ownerId: string, skip?: number, limit?: number): Promise<DatasetDocument[]>;
    countByUser(ownerId: string): Promise<number>;
    findOne(ownerId: string, datasetId: string): Promise<DatasetDocument>;
    getPreview(datasetId: string, limit?: number): Promise<Record<string, unknown>[]>;
    remove(ownerId: string, datasetId: string): Promise<void>;
    private resolveExtension;
    private parseFile;
}
