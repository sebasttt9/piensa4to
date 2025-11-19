import { DashboardsService } from './dashboards.service';
import type { UserDocument } from '../users/schemas/user.schema';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
export declare class DashboardsController {
    private readonly dashboardsService;
    constructor(dashboardsService: DashboardsService);
    create(user: UserDocument, dto: CreateDashboardDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/dashboard.schema").Dashboard, {}, {}> & import("./schemas/dashboard.schema").Dashboard & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    findAll(user: UserDocument, page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./schemas/dashboard.schema").Dashboard, {}, {}> & import("./schemas/dashboard.schema").Dashboard & {
            _id: import("mongoose").Types.ObjectId;
        } & {
            __v: number;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(user: UserDocument, id: string): Promise<import("mongoose").Document<unknown, {}, import("./schemas/dashboard.schema").Dashboard, {}, {}> & import("./schemas/dashboard.schema").Dashboard & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    update(user: UserDocument, id: string, dto: UpdateDashboardDto): Promise<import("mongoose").Document<unknown, {}, import("./schemas/dashboard.schema").Dashboard, {}, {}> & import("./schemas/dashboard.schema").Dashboard & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    share(user: UserDocument, id: string, dto: {
        isPublic: boolean;
    }): Promise<import("mongoose").Document<unknown, {}, import("./schemas/dashboard.schema").Dashboard, {}, {}> & import("./schemas/dashboard.schema").Dashboard & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }>;
    remove(user: UserDocument, id: string): Promise<void>;
}
