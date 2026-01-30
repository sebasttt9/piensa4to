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
        @Inject(SUPABASE_CLIENT)
        private readonly mainSupabase: SupabaseClient,
        private readonly usersService: UsersService,
        private readonly userSyncService: UserSyncService,
    ) { }

    async create(createIssueDto: CreateIssueDto, user: UserEntity) {
        // Ensure user exists in datasets database and get the correct ID for foreign key
        const datasetUser = await this.userSyncService.findOrCreateUserInDataDb(user.email);

        if (!datasetUser) {
            throw new Error('No se pudo sincronizar el usuario en la base de datos de datos');
        }

        const { data, error } = await this.supabase
            .from('issues')
            .insert({
                ...createIssueDto,
                createdById: datasetUser.id,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async findAll() {
        const { data, error } = await this.supabase
            .from('issues')
            .select(`
        *,
        createdBy:users(id, name),
        inventoryItem:inventory_items(id, name)
      `)
            .order('createdAt', { ascending: false });

        if (error) throw error;
        return data;
    }

    async findOne(id: string) {
        const { data, error } = await this.supabase
            .from('issues')
            .select(`
        *,
        createdBy:users(id, name),
        inventoryItem:inventory_items(id, name)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }

    async update(id: string, updateIssueDto: UpdateIssueDto) {
        const { data, error } = await this.supabase
            .from('issues')
            .update(updateIssueDto)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async remove(id: string) {
        const { error } = await this.supabase
            .from('issues')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
