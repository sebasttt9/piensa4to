import { Model } from 'mongoose';
import { DashboardDocument } from './schemas/dashboard.schema';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { DatasetsService } from '../datasets/datasets.service';
export declare class DashboardsService {
    private readonly dashboardModel;
    private readonly datasetsService;
    constructor(dashboardModel: Model<DashboardDocument>, datasetsService: DatasetsService);
    create(ownerId: string, dto: CreateDashboardDto): Promise<DashboardDocument>;
    findAll(ownerId: string, skip?: number, limit?: number): Promise<DashboardDocument[]>;
    countByUser(ownerId: string): Promise<number>;
    findOne(ownerId: string, id: string): Promise<DashboardDocument>;
    update(ownerId: string, id: string, dto: UpdateDashboardDto): Promise<DashboardDocument>;
    share(ownerId: string, id: string, isPublic: boolean): Promise<DashboardDocument>;
    remove(ownerId: string, id: string): Promise<void>;
}
