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
        const normalizedRole = configuredRole?.toLowerCase();
        const role = normalizedRole && Object.values(roles_enum_1.UserRole).includes(normalizedRole)
            ? normalizedRole
            : roles_enum_1.UserRole.Admin;
        if (!email || !password) {
            this.logger.warn('Default admin credentials are not configured. Skipping bootstrap user creation.');
            try {
                await this.provisionExperimentalAccounts();
            }
            catch (error) {
                this.logger.error('Failed to provision experimental accounts:', error);
            }
            return;
        }
        const existing = await this.usersService.findByEmail(email);
        if (existing) {
            this.logger.log(`Default admin '${email}' already exists.`);
        }
        else {
            await this.usersService.create({
                email,
                password,
                name,
                role,
            });
            this.logger.log(`Default admin '${email}' provisioned successfully.`);
        }
        await this.provisionExperimentalAccounts();
    }
    async provisionExperimentalAccounts() {
        const experimentalSeed = this.configService.get('seed.experimentalUsers');
        if (!experimentalSeed?.enabled) {
            this.logger.log('Experimental user seeding disabled.');
            return;
        }
        const accounts = experimentalSeed.users ?? [];
        if (accounts.length === 0) {
            this.logger.warn('Experimental user seeding enabled but no accounts configured.');
            return;
        }
        const allowedRoles = new Set(Object.values(roles_enum_1.UserRole));
        for (const account of accounts) {
            const email = account.email?.toLowerCase()?.trim();
            const password = account.password;
            const name = account.name?.trim() ?? 'DataPulse Demo';
            const configuredRole = account.role?.toLowerCase() ?? roles_enum_1.UserRole.User;
            const role = allowedRoles.has(configuredRole) ? configuredRole : roles_enum_1.UserRole.User;
            if (!email || !password) {
                this.logger.warn('Skipping experimental account without email or password.');
                continue;
            }
            const existing = await this.usersService.findByEmail(email).catch(() => null);
            if (existing) {
                this.logger.log(`Experimental user '${email}' already exists.`);
                continue;
            }
            await this.usersService.create({
                email,
                password,
                name,
                role,
            });
            this.logger.log(`Experimental user '${email}' created successfully.`);
        }
    }
};
exports.UsersInitializer = UsersInitializer;
exports.UsersInitializer = UsersInitializer = UsersInitializer_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        config_1.ConfigService])
], UsersInitializer);
//# sourceMappingURL=users.initializer.js.map