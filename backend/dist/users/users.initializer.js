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
var UsersInitializer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersInitializer = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const roles_enum_1 = require("../common/constants/roles.enum");
const users_service_1 = require("./users.service");
let UsersInitializer = UsersInitializer_1 = class UsersInitializer {
    usersService;
    configService;
    logger = new common_1.Logger(UsersInitializer_1.name);
    constructor(usersService, configService) {
        this.usersService = usersService;
        this.configService = configService;
    }
    async onApplicationBootstrap() {
        const email = this.configService.get('seed.admin.email');
        const password = this.configService.get('seed.admin.password');
        const name = this.configService.get('seed.admin.name') ?? 'DataPulse Admin';
        const configuredRole = this.configService.get('seed.admin.role');
        const role = configuredRole === roles_enum_1.UserRole.User ? roles_enum_1.UserRole.User : roles_enum_1.UserRole.Admin;
        if (!email || !password) {
            this.logger.warn('Default admin credentials are not configured. Skipping bootstrap user creation.');
            return;
        }
        const existing = await this.usersService.findByEmail(email);
        if (existing) {
            this.logger.log(`Default admin '${email}' already exists.`);
            return;
        }
        await this.usersService.create({
            email,
            password,
            name,
            role,
        });
        this.logger.log(`Default admin '${email}' provisioned successfully.`);
    }
};
exports.UsersInitializer = UsersInitializer;
exports.UsersInitializer = UsersInitializer = UsersInitializer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        config_1.ConfigService])
], UsersInitializer);
//# sourceMappingURL=users.initializer.js.map