import { DatasetsService } from './datasets.service';
import type { UserDocument } from '../users/schemas/user.schema';
import { UploadDatasetDto } from './dto/upload-dataset.dto';
export declare class DatasetsController {
    private readonly datasetsService;
    constructor(datasetsService: DatasetsService);
    findAll(user: UserDocument, page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/dataset.schema").Dataset, {}, {}> & import("./schemas/dataset.schema").Dataset & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(user: UserDocument, id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/dataset.schema").Dataset, {}, {}> & import("./schemas/dataset.schema").Dataset & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    create(user: UserDocument, dto: UploadDatasetDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/dataset.schema").Dataset, {}, {}> & import("./schemas/dataset.schema").Dataset & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    update(user: UserDocument, id: string, dto: Partial<UploadDatasetDto>): Promise<import("mongoose").Document<unknown, {}, import("./schemas/dataset.schema").Dataset, {}, {}> & import("./schemas/dataset.schema").Dataset & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    uploadFile(user: UserDocument, id: string, file: Express.Multer.File): Promise<import("mongoose").Document<unknown, {}, import("./schemas/dataset.schema").Dataset, {}, {}> & import("./schemas/dataset.schema").Dataset & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    getPreview(user: UserDocument, id: string, limit?: number): Promise<{
        data: Record<string, unknown>[];
        columns: string[];
        total: number;
    }>;
    analyzeDataset(user: UserDocument, id: string): {
        datasetId: string;
        message: string;
    };
    getInsights(user: UserDocument, id: string): {
        datasetId: string;
        message: string;
    };
    generateReport(user: UserDocument, id: string, format?: 'json' | 'pdf'): Promise<{
        datasetId: string;
        message: string;
    }>;
    remove(user: UserDocument, id: string): Promise<void>;
}
