import { Inject, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../database/supabase.constants';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { OrganizationEntity } from './entities/organization.entity';

interface OrganizationRow {
    id: string;
    name: string;
    description: string | null;
    location?: string | null;
    owner: string | null;
    ci_ruc: string | null;
    business_email?: string | null;
    created_at: string;
    updated_at: string;
}

@Injectable()
export class OrganizationsService {
    constructor(
        @Inject(SUPABASE_CLIENT)
        private readonly supabase: SupabaseClient,
    ) { }

    private readonly tableName = 'organizations';
    private supportsExtendedColumns = true;

    async create(dto: CreateOrganizationDto): Promise<OrganizationEntity> {
        const buildPayload = (includeExtended: boolean) => {
            const payload: Record<string, unknown> = {
                name: dto.name,
                description: dto.description ?? null,
                owner: dto.owner ?? null,
                ci_ruc: dto.ciRuc ?? null,
            };

            if (includeExtended) {
                payload.location = dto.location ?? null;
                payload.business_email = dto.businessEmail ?? null;
            }

            return payload;
        };

        let { data, error } = await this.supabase
            .from(this.tableName)
            .insert(buildPayload(this.supportsExtendedColumns))
            .select('*')
            .single();

        if (error && this.supportsExtendedColumns && this.shouldDowngradeOrgColumns(error)) {
            this.supportsExtendedColumns = false;
            ({ data, error } = await this.supabase
                .from(this.tableName)
                .insert(buildPayload(false))
                .select('*')
                .single());
        }

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
        const buildPayload = (includeExtended: boolean) => {
            const payload: Record<string, unknown> = {};
            if (dto.name !== undefined) payload.name = dto.name;
            if (dto.description !== undefined) payload.description = dto.description ?? null;
            if (dto.owner !== undefined) payload.owner = dto.owner ?? null;
            if (dto.ciRuc !== undefined) payload.ci_ruc = dto.ciRuc ?? null;
            if (includeExtended) {
                if (dto.location !== undefined) payload.location = dto.location ?? null;
                if (dto.businessEmail !== undefined) payload.business_email = dto.businessEmail ?? null;
            }
            return payload;
        };

        const primaryPayload = buildPayload(this.supportsExtendedColumns);

        if (Object.keys(primaryPayload).length === 0) {
            return this.findOne(id);
        }

        let { data, error } = await this.supabase
            .from(this.tableName)
            .update(primaryPayload)
            .eq('id', id)
            .select('*')
            .maybeSingle();

        if ((error || !data) && this.supportsExtendedColumns && this.shouldDowngradeOrgColumns(error)) {
            this.supportsExtendedColumns = false;
            const fallbackPayload = buildPayload(false);
            if (Object.keys(fallbackPayload).length === 0) {
                return this.findOne(id);
            }
            ({ data, error } = await this.supabase
                .from(this.tableName)
                .update(fallbackPayload)
                .eq('id', id)
                .select('*')
                .maybeSingle());
        }

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

    private shouldDowngradeOrgColumns(error: unknown): boolean {
        if (!error || typeof error !== 'object') {
            return false;
        }

        const code = (error as { code?: string }).code;
        return code === '42703' || code === 'PGRST204';
    }
}