import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { DatasetsService } from '../datasets/datasets.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { DashboardEntity } from './entities/dashboard.entity';
import { ShareDashboardDto, ShareChannel } from './dto/share-dashboard.dto';
export interface DashboardShareEntity {
    id: string;
    dashboardId: string;
    ownerId: string;
    channel: ShareChannel;
    contact: string;
    message?: string;
    status: 'pending' | 'sent' | 'failed';
    createdAt: string;
}
export declare class DashboardsService {
    private readonly supabase;
    private readonly datasetsService;
    constructor(supabase: SupabaseClient, datasetsService: DatasetsService);
    private readonly tableName;
    private readonly shareTableName;
    private readonly datasetsJoinTable;
    create(ownerId: string, dto: CreateDashboardDto, userRole?: string, organizationId?: string): Promise<DashboardEntity>;
    findAll(ownerId: string, userRole?: string, skip?: number, limit?: number, organizationId?: string): Promise<DashboardEntity[]>;
    countByUser(ownerId: string, userRole?: string, organizationId?: string): Promise<number>;
    findOne(ownerId: string, id: string, userRole?: string, organizationId?: string): Promise<DashboardEntity>;
    update(ownerId: string, id: string, dto: UpdateDashboardDto, userRole?: string, organizationId?: string): Promise<DashboardEntity>;
    share(ownerId: string, id: string, isPublic: boolean, userRole?: string, organizationId?: string): Promise<DashboardEntity>;
    remove(ownerId: string, id: string, userRole?: string, organizationId?: string): Promise<void>;
    shareWithContact(ownerId: string, id: string, dto: ShareDashboardDto, userRole?: string, organizationId?: string): Promise<DashboardShareEntity>;
    export(ownerId: string, id: string, format: 'pdf' | 'json', userRole?: string, organizationId?: string): Promise<DashboardEntity | Buffer>;
    private toEntity;
    private toShareEntity;
    private replaceDashboardDatasets;
    private collectDatasetIds;
    approveDashboard(ownerId: string, dashboardId: string, status: 'approved' | 'rejected', userRole?: string, organizationId?: string): Promise<DashboardEntity>;
}
