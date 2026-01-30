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
        await this.createProductionUsers();
        await this.createDefaultAdminIfConfigured();
    }
    async createProductionUsers() {
        const productionUsers = [
            {
                email: 'superadmin@datapulse.local',
                password: 'SuperAdmin2024!',
                name: 'Super Administrator',
                role: roles_enum_1.UserRole.SuperAdmin,
            },
            {
                email: 'admin@datapulse.local',
                password: 'Admin2024!',
                name: 'Administrator',
                role: roles_enum_1.UserRole.Admin,
            },
        ];
        for (const userData of productionUsers) {
            const existing = await this.usersService.findByEmail(userData.email).catch(() => null);
            if (existing) {
                this.logger.log(`Production user '${userData.email}' already exists.`);
                continue;
            }
            await this.usersService.create(userData);
            this.logger.log(`Production user '${userData.email}' created successfully.`);
        }
    }
    async createDefaultAdminIfConfigured() {
        const email = this.configService.get('seed.admin.email');
        const password = this.configService.get('seed.admin.password');
        const name = this.configService.get('seed.admin.name') ?? 'DataPulse Admin';
        const configuredRole = this.configService.get('seed.admin.role');
        const normalizedRole = configuredRole?.toLowerCase();
        const role = normalizedRole && Object.values(roles_enum_1.UserRole).includes(normalizedRole)
            ? normalizedRole
            : roles_enum_1.UserRole.Admin;
        if (!email || !password) {
            this.logger.log('No additional admin configured via environment variables.');
            return;
        }
        const existing = await this.usersService.findByEmail(email);
        if (existing) {
            this.logger.log(`Configured admin '${email}' already exists.`);
            return;
        }
        await this.usersService.create({
            email,
            password,
            name,
            role,
        });
        this.logger.log(`Configured admin '${email}' provisioned successfully.`);
    }
    async provisionExperimentalAccounts() {
        this.logger.log('Experimental user seeding disabled for production environment.');
    }
};
exports.UsersInitializer = UsersInitializer;
exports.UsersInitializer = UsersInitializer = UsersInitializer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        config_1.ConfigService])
], UsersInitializer);
//# sourceMappingURL=users.initializer.js.map