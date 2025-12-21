"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const dataset_schema_1 = require("../datasets/schemas/dataset.schema");
const dashboard_schema_1 = require("../dashboards/schemas/dashboard.schema");
let AnalyticsService = class AnalyticsService {
    datasetModel;
    dashboardModel;
    constructor(datasetModel, dashboardModel) {
        this.datasetModel = datasetModel;
        this.dashboardModel = dashboardModel;
    }
    async getOverview(ownerId) {
        const [datasets, dashboards] = await Promise.all([
            this.datasetModel.find({ owner: ownerId }).lean().exec(),
            this.dashboardModel.find({ owner: ownerId }).lean().exec(),
        ]);
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
                createdCharts: dashboards.reduce((acc, dashboard) => acc + (dashboard.charts?.length ?? 0), 0),
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
    buildMonthlySeries() {
        return [
            { month: 'Ene', revenue: 42000, costs: 26000 },
            { month: 'Feb', revenue: 45000, costs: 28000 },
            { month: 'Mar', revenue: 51000, costs: 31000 },
            { month: 'Abr', revenue: 56000, costs: 33000 },
            { month: 'May', revenue: 59000, costs: 34000 },
            { month: 'Jun', revenue: 64000, costs: 36000 },
        ];
    }
    calculateGrowth(series) {
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
    buildQuarterlyRevenue(series) {
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
    calculateStorage(datasets) {
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
    buildCategoryDistribution(datasets) {
        const tagCounter = new Map();
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(dataset_schema_1.Dataset.name)),
    __param(1, (0, mongoose_1.InjectModel)(dashboard_schema_1.Dashboard.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map