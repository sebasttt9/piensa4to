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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardSchema = exports.Dashboard = exports.ChartConfigSchema = exports.ChartConfig = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("../../users/schemas/user.schema");
const dataset_schema_1 = require("../../datasets/schemas/dataset.schema");
let ChartConfig = class ChartConfig {
    type;
    title;
    settings;
};
exports.ChartConfig = ChartConfig;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ChartConfig.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], ChartConfig.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: true }),
    __metadata("design:type", Object)
], ChartConfig.prototype, "settings", void 0);
exports.ChartConfig = ChartConfig = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], ChartConfig);
exports.ChartConfigSchema = mongoose_1.SchemaFactory.createForClass(ChartConfig);
let Dashboard = class Dashboard {
    owner;
    dataset;
    title;
    description;
    charts;
    filters;
};
exports.Dashboard = Dashboard;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: user_schema_1.User.name, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Dashboard.prototype, "owner", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: dataset_schema_1.Dataset.name, required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Dashboard.prototype, "dataset", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Dashboard.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ trim: true }),
    __metadata("design:type", String)
], Dashboard.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [exports.ChartConfigSchema], default: [] }),
    __metadata("design:type", Array)
], Dashboard.prototype, "charts", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Dashboard.prototype, "filters", void 0);
exports.Dashboard = Dashboard = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Dashboard);
exports.DashboardSchema = mongoose_1.SchemaFactory.createForClass(Dashboard);
//# sourceMappingURL=dashboard.schema.js.map