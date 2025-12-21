import { HydratedDocument, Types } from 'mongoose';
export declare class DashboardChart {
    type: string;
    title?: string;
    config: Record<string, unknown>;
}
export declare class Dashboard {
    owner: Types.ObjectId;
    name: string;
    description?: string;
    datasetIds: Types.ObjectId[];
    layout: Record<string, unknown>;
    charts: DashboardChart[];
    isPublic: boolean;
}
export type DashboardDocument = HydratedDocument<Dashboard>;
export declare const DashboardSchema: import("mongoose").Schema<Dashboard, import("mongoose").Model<Dashboard, any, any, any, import("mongoose").Document<unknown, any, Dashboard, any, {}> & Dashboard & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Dashboard, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Dashboard>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Dashboard> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
