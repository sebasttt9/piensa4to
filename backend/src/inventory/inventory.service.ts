import { Inject, Injectable, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_DATA_CLIENT } from '../database/supabase.constants';
import { AnalyticsService, OverviewAnalytics } from '../analytics/analytics.service';

interface DatasetRow {
    id: string;
    owner_id: string;
    name: string;
    status: 'pending' | 'processed' | 'error';
    row_count: number | null;
    updated_at: string;
    tags: string[] | null;
}

interface DashboardRow {
    id: string;
    owner_id: string;
    name: string;
    dataset_ids: string[] | null;
    updated_at: string;
}

interface InventoryAdjustmentRow {
    dataset_id: string;
    owner_id: string;
    adjustment: number;
    updated_at: string;
}

export interface InventoryDashboardSummary {
    id: string;
    name: string;
    updatedAt: string;
}

export interface InventoryDatasetSummary {
    id: string;
    name: string;
    status: 'pending' | 'processed' | 'error';
    rowCount: number;
    updatedAt: string;
    tags: string[];
}

export interface InventoryRecord {
    dataset: InventoryDatasetSummary;
    dashboards: InventoryDashboardSummary[];
    adjustment: number;
    total: number;
}

export interface InventorySummary {
    overview: OverviewAnalytics | null;
    totals: {
        baseUnits: number;
        adjustedUnits: number;
        datasetsWithAlerts: number;
        dashboardsLinked: number;
    };
    records: InventoryRecord[];
}

@Injectable()
export class InventoryService {
    private readonly inventoryTable = 'inventory_adjustments';
    private readonly datasetsTable = 'datasets';
    private readonly dashboardsTable = 'dashboards';

    constructor(
        @Inject(SUPABASE_DATA_CLIENT)
        private readonly supabase: SupabaseClient,
        private readonly analyticsService: AnalyticsService,
    ) { }

    async getInventory(ownerId: string): Promise<InventorySummary> {
        const [datasets, dashboards, adjustments, overview] = await Promise.all([
            this.fetchDatasets(ownerId),
            this.fetchDashboards(ownerId),
            this.fetchAdjustments(ownerId),
            this.safeGetOverview(ownerId),
        ]);

        const records = this.buildRecords(datasets, dashboards, adjustments);
        const totals = this.buildTotals(records, dashboards.length);

        return {
            overview,
            totals,
            records,
        };
    }

    async adjustInventory(ownerId: string, datasetId: string, amount: number): Promise<InventorySummary> {
        if (!Number.isFinite(amount) || amount === 0) {
            throw new BadRequestException('El ajuste de inventario debe ser un entero distinto de cero.');
        }

        await this.ensureDatasetOwnership(ownerId, datasetId);

        const current = await this.fetchAdjustment(ownerId, datasetId);
        const nextValue = (current?.adjustment ?? 0) + amount;

        if (nextValue === 0) {
            const { error } = await this.supabase
                .from(this.inventoryTable)
                .delete()
                .eq('owner_id', ownerId)
                .eq('dataset_id', datasetId);

            if (error) {
                throw new InternalServerErrorException('No se pudo actualizar el inventario.');
            }
        } else {
            const { error } = await this.supabase
                .from(this.inventoryTable)
                .upsert({
                    owner_id: ownerId,
                    dataset_id: datasetId,
                    adjustment: nextValue,
                }, { onConflict: 'owner_id,dataset_id' });

            if (error) {
                throw new InternalServerErrorException('No se pudo actualizar el inventario.');
            }
        }

        return this.getInventory(ownerId);
    }

    async resetAdjustments(ownerId: string): Promise<InventorySummary> {
        const { error } = await this.supabase
            .from(this.inventoryTable)
            .delete()
            .eq('owner_id', ownerId);

        if (error) {
            throw new InternalServerErrorException('No se pudo reiniciar los ajustes de inventario.');
        }

        return this.getInventory(ownerId);
    }

    private async fetchDatasets(ownerId: string): Promise<DatasetRow[]> {
        const { data, error } = await this.supabase
            .from(this.datasetsTable)
            .select('id, owner_id, name, status, row_count, updated_at, tags')
            .eq('owner_id', ownerId);

        if (error) {
            throw new InternalServerErrorException('No se pudieron leer los datasets desde Supabase.');
        }

        return (data ?? []) as DatasetRow[];
    }

    private async fetchDashboards(ownerId: string): Promise<DashboardRow[]> {
        const { data, error } = await this.supabase
            .from(this.dashboardsTable)
            .select('id, owner_id, name, dataset_ids, updated_at')
            .eq('owner_id', ownerId);

        if (error) {
            throw new InternalServerErrorException('No se pudieron leer los dashboards desde Supabase.');
        }

        return (data ?? []) as DashboardRow[];
    }

    private async fetchAdjustments(ownerId: string): Promise<InventoryAdjustmentRow[]> {
        const { data, error } = await this.supabase
            .from(this.inventoryTable)
            .select('dataset_id, owner_id, adjustment, updated_at')
            .eq('owner_id', ownerId);

        if (error) {
            throw new InternalServerErrorException('No se pudieron leer los ajustes de inventario desde Supabase.');
        }

        return (data ?? []) as InventoryAdjustmentRow[];
    }

    private async fetchAdjustment(ownerId: string, datasetId: string): Promise<InventoryAdjustmentRow | null> {
        const { data, error } = await this.supabase
            .from(this.inventoryTable)
            .select('dataset_id, owner_id, adjustment, updated_at')
            .eq('owner_id', ownerId)
            .eq('dataset_id', datasetId)
            .maybeSingle();

        if (error) {
            throw new InternalServerErrorException('No se pudo leer el ajuste actual de inventario.');
        }

        return (data as InventoryAdjustmentRow | null) ?? null;
    }

    private async ensureDatasetOwnership(ownerId: string, datasetId: string): Promise<void> {
        const { data, error } = await this.supabase
            .from(this.datasetsTable)
            .select('id')
            .eq('id', datasetId)
            .eq('owner_id', ownerId)
            .maybeSingle();

        if (error) {
            throw new InternalServerErrorException('No se pudo validar el dataset en Supabase.');
        }

        if (!data) {
            throw new NotFoundException('El dataset indicado no existe o no pertenece a tu cuenta.');
        }
    }

    private buildRecords(
        datasets: DatasetRow[],
        dashboards: DashboardRow[],
        adjustments: InventoryAdjustmentRow[],
    ): InventoryRecord[] {
        const adjustmentMap = new Map<string, number>();
        adjustments.forEach((row) => {
            adjustmentMap.set(row.dataset_id, row.adjustment);
        });

        const dashboardMap = new Map<string, InventoryDashboardSummary[]>();
        dashboards.forEach((dashboard) => {
            const targets = dashboard.dataset_ids ?? [];
            targets.forEach((datasetId) => {
                const list = dashboardMap.get(datasetId) ?? [];
                list.push({
                    id: dashboard.id,
                    name: dashboard.name,
                    updatedAt: dashboard.updated_at,
                });
                dashboardMap.set(datasetId, list);
            });
        });

        return datasets.map((dataset) => {
            const baseCount = dataset.row_count ?? 0;
            const adjustment = adjustmentMap.get(dataset.id) ?? 0;
            const total = baseCount + adjustment;

            return {
                dataset: {
                    id: dataset.id,
                    name: dataset.name,
                    status: dataset.status,
                    rowCount: baseCount,
                    updatedAt: dataset.updated_at,
                    tags: dataset.tags ?? [],
                },
                dashboards: dashboardMap.get(dataset.id) ?? [],
                adjustment,
                total,
            };
        });
    }

    private buildTotals(records: InventoryRecord[], dashboardCount: number) {
        const baseUnits = records.reduce((acc, record) => acc + record.dataset.rowCount, 0);
        const adjustedUnits = records.reduce((acc, record) => acc + record.total, 0);
        const datasetsWithAlerts = records.filter((record) => record.dataset.status !== 'processed').length;

        return {
            baseUnits,
            adjustedUnits,
            datasetsWithAlerts,
            dashboardsLinked: dashboardCount,
        };
    }

    private async safeGetOverview(ownerId: string): Promise<OverviewAnalytics | null> {
        try {
            return await this.analyticsService.getOverview(ownerId);
        } catch (error) {
            // If analytics fails we still want inventory to load.
            // eslint-disable-next-line no-console
            console.warn('Failed to fetch analytics overview for inventory view:', error);
            return null;
        }
    }
}
