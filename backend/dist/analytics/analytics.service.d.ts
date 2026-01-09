import { SupabaseClient } from '@supabase/supabase-js';
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
        monthlySeries: Array<{
            month: string;
            revenue: number;
            costs: number;
        }>;
        quarterlyRevenue: Array<{
            label: string;
            revenue: number;
        }>;
    };
    categoryDistribution: Array<{
        name: string;
        value: number;
    }>;
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
export declare class AnalyticsService {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
    getOverview(ownerId: string): Promise<OverviewAnalytics>;
    private buildMonthlySeries;
    private calculateGrowth;
    private buildQuarterlyRevenue;
    private calculateStorage;
    private buildCategoryDistribution;
}
