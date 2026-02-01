import { Inject, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_DATA_CLIENT } from '../database/supabase.constants';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { OrganizationEntity } from './entities/organization.entity';

interface OrganizationRow {
    id: string;
    name: string;
    description: string | null;
    location: string | null;
    owner: string | null;
    ci_ruc: string | null;
    business_email: string | null;
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
                location: dto.location ?? null,
                owner: dto.owner ?? null,
                ci_ruc: dto.ciRuc ?? null,
                business_email: dto.businessEmail ?? null,
            })
            .select('*')
            .single();

        if (error) {
            console.error('Supabase error creando organización', error);
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
            console.error('Supabase error listando organizaciones', error);
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
            if (error) {
                console.error('Supabase error obteniendo organización', error);
            }
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
            if (error) {
                console.error('Supabase error actualizando organización', error);
            }
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
            console.error('Supabase error eliminando organización', error);
            throw new InternalServerErrorException('No se pudo eliminar la organización');
        }
    }

    private toEntity(row: OrganizationRow): OrganizationEntity {
        return {
            id: row.id,
            name: row.name,
            description: row.description ?? undefined,
            location: row.location ?? undefined,
            owner: row.owner ?? undefined,
            ciRuc: row.ci_ruc ?? undefined,
            businessEmail: row.business_email ?? undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}