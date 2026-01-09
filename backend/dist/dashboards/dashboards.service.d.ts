import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { DatasetsService } from '../datasets/datasets.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { DashboardEntity } from './entities/dashboard.entity';
export declare class DashboardsService {
    private readonly supabase;
    private readonly datasetsService;
    constructor(supabase: SupabaseClient, datasetsService: DatasetsService);
    private readonly tableName;
    create(ownerId: string, dto: CreateDashboardDto): Promise<DashboardEntity>;
    findAll(ownerId: string, skip?: number, limit?: number): Promise<DashboardEntity[]>;
    countByUser(ownerId: string): Promise<number>;
    findOne(ownerId: string, id: string): Promise<DashboardEntity>;
    update(ownerId: string, id: string, dto: UpdateDashboardDto): Promise<DashboardEntity>;
    share(ownerId: string, id: string, isPublic: boolean): Promise<DashboardEntity>;
    remove(ownerId: string, id: string): Promise<void>;
    private toEntity;
}
