import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT, SUPABASE_DATA_CLIENT } from '../database/supabase.constants';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { UsersService } from '../users/users.service';
import { UserEntity } from '../users/entities/user.entity';
import { UserSyncService } from '../users/user-sync.service';

@Injectable()
export class IssuesService {
    constructor(
        @Inject(SUPABASE_DATA_CLIENT)
        private readonly supabase: SupabaseClient,
        @Inject(SUPABASE_DATA_CLIENT)
        private readonly dataSupabase: SupabaseClient,
        private readonly usersService: UsersService,
        private readonly userSyncService: UserSyncService,
    ) { }

    async create(createIssueDto: CreateIssueDto, user: UserEntity) {
        // Ensure user exists in datasets database and get the correct ID for foreign key
        const datasetUser = await this.userSyncService.findOrCreateUserInDataDb(user.email);

        if (!datasetUser) {
            throw new Error('No se pudo sincronizar el usuario en la base de datos de datos');
        }

        const { inventoryItemId, ...issueData } = createIssueDto;

        const { data, error } = await this.supabase
            .from('issues')
            .insert({
                ...issueData,
                owner_id: datasetUser.id,
                inventory_item_id: inventoryItemId,
                organization_id: user.organizationId,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findAll(ownerId: string, userRole: string = 'user', organizationId?: string) {
        let query = this.supabase
            .from('issues')
            .select(`
        *,
        owner:users!issues_owner_id_fkey(id, name),
        inventoryItem:inventory_items(id, name)
      `)
            .order('created_at', { ascending: false });

        // Filter based on user role and organization
        if (userRole === 'admin' || userRole === 'superadmin') {
            // Admins and superadmins can see issues from their organization
            if (organizationId) {
                query = query.eq('organization_id', organizationId);
            }
        } else {
            // Regular users can only see their own issues
            query = query.eq('owner_id', ownerId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    }

    async findOne(id: string, ownerId: string, userRole: string = 'user', organizationId?: string) {
        let query = this.supabase
            .from('issues')
            .select(`
        *,
        owner:users!issues_owner_id_fkey(id, name),
        inventoryItem:inventory_items(id, name)
      `)
            .eq('id', id);

        // Filter based on user role and organization
        if (userRole === 'admin' || userRole === 'superadmin') {
            // Admins and superadmins can access issues from their organization
            if (organizationId) {
                query = query.eq('organization_id', organizationId);
            } else {
                query = query.eq('owner_id', ownerId);
            }
        } else {
            // Regular users can only access their own issues
            query = query.eq('owner_id', ownerId);
        }

        const { data, error } = await query.single();

        if (error) throw error;
        return data;
    }

    async update(id: string, updateIssueDto: UpdateIssueDto, ownerId: string, userRole: string = 'user', organizationId?: string) {
        let query = this.supabase
            .from('issues')
            .update(updateIssueDto)
            .eq('id', id);

        // Filter based on user role and organization
        if (userRole === 'admin' || userRole === 'superadmin') {
            // Admins and superadmins can update issues from their organization
            if (organizationId) {
                query = query.eq('organization_id', organizationId);
            } else {
                query = query.eq('owner_id', ownerId);
            }
        } else {
            // Regular users can only update their own issues
            query = query.eq('owner_id', ownerId);
        }

        const { data, error } = await query.select().single();

        if (error) throw error;
        return data;
    }

    async remove(id: string, ownerId: string, userRole: string = 'user', organizationId?: string) {
        let query = this.supabase
            .from('issues')
            .delete()
            .eq('id', id);

        // Filter based on user role and organization
        if (userRole === 'admin' || userRole === 'superadmin') {
            // Admins and superadmins can delete issues from their organization
            if (organizationId) {
                query = query.eq('organization_id', organizationId);
            } else {
                query = query.eq('owner_id', ownerId);
            }
        } else {
            // Regular users can only delete their own issues
            query = query.eq('owner_id', ownerId);
        }

        const { error } = await query;

        if (error) throw error;
    }
}
