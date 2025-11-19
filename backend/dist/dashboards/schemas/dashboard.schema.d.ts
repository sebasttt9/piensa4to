import { HydratedDocument, Types } from 'mongoose';
export declare class ChartConfig {
    type: string;
    title?: string;
    settings: Record<string, unknown>;
}
export declare const ChartConfigSchema: import("mongoose").Schema<ChartConfig, import("mongoose").Model<ChartConfig, any, any, any, import("mongoose").Document<unknown, any, ChartConfig, any, {}> & ChartConfig & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ChartConfig, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<ChartConfig>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<ChartConfig> & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Dashboard {
    owner: Types.ObjectId;
    dataset: Types.ObjectId;
    title: string;
    description?: string;
    charts: ChartConfig[];
    filters: Record<string, unknown>;
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
