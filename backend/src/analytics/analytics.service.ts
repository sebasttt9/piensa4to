import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_DATA_CLIENT } from '../database/supabase.constants';
import { DashboardChartEntity } from '../dashboards/entities/dashboard.entity';

export interface OverviewAnalytics {
    summary: {
        totalDatasets: number;
        activeReports: number;
        createdCharts: number;
        growthPercentage: number;
    };
    financial: {
        totalRevenue: number;
        totalCosts: number;
        netProfit: number;
        monthlySeries: Array<{ month: string; revenue: number; costs: number }>;
        quarterlyRevenue: Array<{ label: string; revenue: number }>;
    };
    categoryDistribution: Array<{ name: string; value: number }>;
    datasetHealth: {
        processed: number;
        pending: number;
        error: number;
    };
    storage: {
        usedMb: number;
        capacityMb: number;
        usagePercentage: number;
    };
    lastUpdated: string;
}

interface DatasetSummary {
    status: 'pending' | 'processed' | 'error';
    fileSize?: number;
    tags?: string[];
}

interface DashboardSummary {
    charts?: DashboardChartEntity[] | null;
}

@Injectable()
export class AnalyticsService {
    constructor(
        @Inject(SUPABASE_DATA_CLIENT)
        private readonly supabase: SupabaseClient,
    ) { }

    async getOverview(ownerId: string): Promise<OverviewAnalytics> {
        const [datasetsResponse, dashboardsResponse] = await Promise.all([
            this.supabase
                .from('datasets')
                .select('status, file_size, tags')
                .eq('owner_id', ownerId),
            this.supabase
                .from('dashboards')
                .select('charts')
                .eq('owner_id', ownerId),
        ]);

        if (datasetsResponse.error) {
            throw new InternalServerErrorException('No se pudo obtener la información de datasets');
        }

        if (dashboardsResponse.error) {
            throw new InternalServerErrorException('No se pudo obtener la información de dashboards');
        }

        const datasets: DatasetSummary[] = ((datasetsResponse.data ?? []) as Array<{
            status: 'pending' | 'processed' | 'error';
            file_size: number | null;
            tags: string[] | null;
        }>).map((dataset) => ({
            status: dataset.status,
            fileSize: dataset.file_size ?? undefined,
            tags: dataset.tags ?? undefined,
        }));

        const dashboards: DashboardSummary[] = (dashboardsResponse.data ?? []) as DashboardSummary[];

        const monthlySeries = this.buildMonthlySeries();
        const totalRevenue = monthlySeries.reduce((acc, item) => acc + item.revenue, 0);
        const totalCosts = monthlySeries.reduce((acc, item) => acc + item.costs, 0);
        const netProfit = totalRevenue - totalCosts;
        const growthPercentage = this.calculateGrowth(monthlySeries);
        const quarterlyRevenue = this.buildQuarterlyRevenue(monthlySeries);
        const storage = this.calculateStorage(datasets);
        const categoryDistribution = this.buildCategoryDistribution(datasets);

        return {
            summary: {
                totalDatasets: datasets.length,
                activeReports: dashboards.length,
                createdCharts: dashboards.reduce(
                    (acc, dashboard) => acc + (dashboard.charts?.length ?? 0),
                    0,
                ),
                growthPercentage,
            },
            financial: {
                totalRevenue,
                totalCosts,
                netProfit,
                monthlySeries,
                quarterlyRevenue,
            },
            categoryDistribution,
            datasetHealth: {
                processed: datasets.filter((dataset) => dataset.status === 'processed').length,
                pending: datasets.filter((dataset) => dataset.status === 'pending').length,
                error: datasets.filter((dataset) => dataset.status === 'error').length,
            },
            storage,
            lastUpdated: new Date().toISOString(),
        };
    }

    private buildMonthlySeries(): Array<{ month: string; revenue: number; costs: number }> {
        return [
            { month: 'Ene', revenue: 42000, costs: 26000 },
            { month: 'Feb', revenue: 45000, costs: 28000 },
            { month: 'Mar', revenue: 51000, costs: 31000 },
            { month: 'Abr', revenue: 56000, costs: 33000 },
            { month: 'May', revenue: 59000, costs: 34000 },
            { month: 'Jun', revenue: 64000, costs: 36000 },
        ];
    }

    private calculateGrowth(series: Array<{ revenue: number }>): number {
        if (series.length < 2) {
            return 0;
        }

        const first = series[0].revenue;
        const last = series[series.length - 1].revenue;

        if (first === 0) {
            return 0;
        }

        return Number((((last - first) / first) * 100).toFixed(1));
    }

    private buildQuarterlyRevenue(
        series: Array<{ month: string; revenue: number }>,
    ): Array<{ label: string; revenue: number }> {
        const chunks = [
            { label: 'Q1', months: series.slice(0, 3) },
            { label: 'Q2', months: series.slice(3, 6) },
        ];

        return chunks
            .filter((chunk) => chunk.months.length > 0)
            .map((chunk) => ({
                label: chunk.label,
                revenue: chunk.months.reduce((acc, item) => acc + item.revenue, 0),
            }));
    }

    private calculateStorage(
        datasets: Array<{ fileSize?: number }>,
    ): { usedMb: number; capacityMb: number; usagePercentage: number } {
        const usedBytes = datasets.reduce((acc, dataset) => acc + (dataset.fileSize ?? 0), 0);
        const usedMb = Number((usedBytes / (1024 * 1024)).toFixed(1));
        const capacityMb = 1024;
        const usagePercentageRaw = capacityMb <= 0
            ? 0
            : Number(((usedMb / capacityMb) * 100).toFixed(1));

        return {
            usedMb,
            capacityMb,
            usagePercentage: Math.min(100, usagePercentageRaw),
        };
    }

    private buildCategoryDistribution(
        datasets: Array<{ tags?: string[] }>,
    ): Array<{ name: string; value: number }> {
        const tagCounter = new Map<string, number>();

        for (const dataset of datasets) {
            if (!dataset.tags || dataset.tags.length === 0) {
                continue;
            }

            for (const tag of dataset.tags) {
                tagCounter.set(tag, (tagCounter.get(tag) ?? 0) + 1);
            }
        }

        if (tagCounter.size === 0) {
            return [
                { name: 'Productos', value: 45 },
                { name: 'Servicios', value: 30 },
                { name: 'Consultoría', value: 25 },
            ];
        }

        const total = Array.from(tagCounter.values()).reduce((acc, value) => acc + value, 0);

        return Array.from(tagCounter.entries()).map(([name, value]) => ({
            name,
            value: Number(((value / total) * 100).toFixed(1)),
        }));
    }
}
