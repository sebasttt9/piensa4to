import { Inject, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_DATA_CLIENT } from '../database/supabase.constants';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { OrganizationEntity } from './entities/organization.entity';

interface OrganizationRow {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

@Injectable()
export class OrganizationsService {
    constructor(
        @Inject(SUPABASE_DATA_CLIENT)
        private readonly supabase: SupabaseClient,
    ) { }

    private readonly tableName = 'organizations';

    async create(dto: CreateOrganizationDto): Promise<OrganizationEntity> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .insert({
                name: dto.name,
                description: dto.description ?? null,
            })
            .select('*')
            .single();

        if (error) {
            throw new InternalServerErrorException('No se pudo crear la organización');
        }

        return this.toEntity(data as OrganizationRow);
    }

    async findAll(): Promise<OrganizationEntity[]> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new InternalServerErrorException('No se pudieron listar las organizaciones');
        }

        return (data as OrganizationRow[]).map(row => this.toEntity(row));
    }

    async findOne(id: string): Promise<OrganizationEntity> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException('Organización no encontrada');
        }

        return this.toEntity(data as OrganizationRow);
    }

    async update(id: string, dto: UpdateOrganizationDto): Promise<OrganizationEntity> {
        const { data, error } = await this.supabase
            .from(this.tableName)
            .update(dto)
            .eq('id', id)
            .select('*')
            .single();

        if (error || !data) {
            throw new NotFoundException('Organización no encontrada');
        }

        return this.toEntity(data as OrganizationRow);
    }

    async remove(id: string): Promise<void> {
        const { error } = await this.supabase
            .from(this.tableName)
            .delete()
            .eq('id', id);

        if (error) {
            throw new InternalServerErrorException('No se pudo eliminar la organización');
        }
    }

    private toEntity(row: OrganizationRow): OrganizationEntity {
        return {
            id: row.id,
            name: row.name,
            description: row.description ?? undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}