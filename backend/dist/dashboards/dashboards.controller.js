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
exports.DashboardsController = void 0;
const common_1 = require("@nestjs/common");
const dashboards_service_1 = require("./dashboards.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const create_dashboard_dto_1 = require("./dto/create-dashboard.dto");
const update_dashboard_dto_1 = require("./dto/update-dashboard.dto");
let DashboardsController = class DashboardsController {
    dashboardsService;
    constructor(dashboardsService) {
        this.dashboardsService = dashboardsService;
    }
    create(user, dto) {
        return this.dashboardsService.create(user.id, dto);
    }
    async findAll(user, page = 1, limit = 10) {
        const parsedPage = Number(page) || 1;
        const parsedLimit = Number(limit) || 10;
        const skip = (parsedPage - 1) * parsedLimit;
        const [dashboards, total] = await Promise.all([
            this.dashboardsService.findAll(user.id, skip, parsedLimit),
            this.dashboardsService.countByUser(user.id),
        ]);
        return {
            data: dashboards,
            total,
            page: parsedPage,
            limit: parsedLimit,
        };
    }
    findOne(user, id) {
        return this.dashboardsService.findOne(user.id, id);
    }
    update(user, id, dto) {
        return this.dashboardsService.update(user.id, id, dto);
    }
    share(user, id, dto) {
        return this.dashboardsService.share(user.id, id, dto.isPublic);
    }
    remove(user, id) {
        return this.dashboardsService.remove(user.id, id);
    }
};
exports.DashboardsController = DashboardsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_dashboard_dto_1.CreateDashboardDto]),
    __metadata("design:returntype", void 0)
], DashboardsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], DashboardsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DashboardsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_dashboard_dto_1.UpdateDashboardDto]),
    __metadata("design:returntype", void 0)
], DashboardsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/share'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], DashboardsController.prototype, "share", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DashboardsController.prototype, "remove", null);
exports.DashboardsController = DashboardsController = __decorate([
    (0, common_1.Controller)('dashboards'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [dashboards_service_1.DashboardsService])
], DashboardsController);
//# sourceMappingURL=dashboards.controller.js.map