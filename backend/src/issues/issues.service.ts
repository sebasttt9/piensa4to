import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_DATA_CLIENT } from '../database/supabase.constants';
import { CreateIssueDto } from './dto/create-issue.dto';
import { UpdateIssueDto } from './dto/update-issue.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class IssuesService {
    constructor(
        @Inject(SUPABASE_DATA_CLIENT)
        private readonly supabase: SupabaseClient,
        private readonly usersService: UsersService,
    ) { }

    async create(createIssueDto: CreateIssueDto, userId: string) {
        // Validate that the user exists
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new Error('Usuario no encontrado. Por favor, vuelve a iniciar sesión.');
        }

        const { data, error } = await this.supabase
            .from('issues')
            .insert({
                ...createIssueDto,
                createdById: userId,
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
