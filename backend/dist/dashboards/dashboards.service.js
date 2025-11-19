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
exports.DashboardsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const dashboard_schema_1 = require("./schemas/dashboard.schema");
const datasets_service_1 = require("../datasets/datasets.service");
let DashboardsService = class DashboardsService {
    dashboardModel;
    datasetsService;
    constructor(dashboardModel, datasetsService) {
        this.dashboardModel = dashboardModel;
        this.datasetsService = datasetsService;
    }
    async create(ownerId, dto) {
        if (dto.datasetIds && dto.datasetIds.length > 0) {
            for (const datasetId of dto.datasetIds) {
                await this.datasetsService.findOne(ownerId, datasetId);
            }
        }
        const dashboard = new this.dashboardModel({
            owner: new mongoose_2.Types.ObjectId(ownerId),
            name: dto.name,
            description: dto.description,
            datasetIds: (dto.datasetIds || []).map((id) => new mongoose_2.Types.ObjectId(id)),
            layout: {},
            charts: [],
            isPublic: false,
        });
        return dashboard.save();
    }
    async findAll(ownerId, skip = 0, limit = 10) {
        return this.dashboardModel
            .find({ owner: ownerId })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
    }
    async countByUser(ownerId) {
        return this.dashboardModel.countDocuments({ owner: ownerId });
    }
    async findOne(ownerId, id) {
        const dashboard = await this.dashboardModel
            .findOne({ _id: id, owner: ownerId })
            .exec();
        if (!dashboard) {
            throw new common_1.NotFoundException('Dashboard no encontrado');
        }
        return dashboard;
    }
    async update(ownerId, id, dto) {
        const { datasetIds, ...rest } = dto;
        if (datasetIds && datasetIds.length > 0) {
            for (const datasetId of datasetIds) {
                await this.datasetsService.findOne(ownerId, datasetId);
            }
        }
        const updatePayload = { ...rest };
        if (datasetIds) {
            updatePayload.datasetIds = datasetIds.map((id) => new mongoose_2.Types.ObjectId(id));
        }
        const dashboard = await this.dashboardModel
            .findOneAndUpdate({ _id: id, owner: ownerId }, updatePayload, {
            new: true,
            runValidators: true,
        })
            .exec();
        if (!dashboard) {
            throw new common_1.NotFoundException('Dashboard no encontrado');
        }
        return dashboard;
    }
    async share(ownerId, id, isPublic) {
        const dashboard = await this.dashboardModel
            .findOneAndUpdate({ _id: id, owner: ownerId }, { isPublic }, { new: true })
            .exec();
        if (!dashboard) {
            throw new common_1.NotFoundException('Dashboard no encontrado');
        }
        return dashboard;
    }
    async remove(ownerId, id) {
        const result = await this.dashboardModel.deleteOne({
            _id: id,
            owner: ownerId,
        });
        if (!result.deletedCount) {
            throw new common_1.NotFoundException('Dashboard no encontrado');
        }
    }
};
exports.DashboardsService = DashboardsService;
exports.DashboardsService = DashboardsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(dashboard_schema_1.Dashboard.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        datasets_service_1.DatasetsService])
], DashboardsService);
//# sourceMappingURL=dashboards.service.js.map