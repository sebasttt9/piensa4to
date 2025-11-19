import { HydratedDocument, Types } from 'mongoose';
import type { DatasetAnalysis } from '../interfaces/dataset-analysis.interface';
export declare class Dataset {
    owner: Types.ObjectId;
    name: string;
    description?: string;
    filename?: string;
    fileSize?: number;
    fileType?: 'csv' | 'xlsx';
    rowCount?: number;
    columnCount?: number;
    analysis?: DatasetAnalysis;
    preview: Record<string, unknown>[];
    status: 'pending' | 'processed' | 'error';
    tags: string[];
}
export type DatasetDocument = HydratedDocument<Dataset>;
export declare const DatasetSchema: import("mongoose").Schema<Dataset, import("mongoose").Model<Dataset, any, any, any, import("mongoose").Document<unknown, any, Dataset, any, {}> & Dataset & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Dataset, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Dataset>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Dataset> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
