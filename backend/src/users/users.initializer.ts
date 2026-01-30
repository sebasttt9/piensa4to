import { Injectable, Logger } from '@nestjs/common';
import { OnApplicationBootstrap } from '@nestjs/common/interfaces/hooks/on-application-bootstrap.interface';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../common/constants/roles.enum';
import { UsersService } from './users.service';

type ExperimentalSeedUser = {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
};

type ExperimentalSeedConfig = {
    enabled?: boolean;
    users?: ExperimentalSeedUser[];
};

@Injectable()
export class UsersInitializer implements OnApplicationBootstrap {
    private readonly logger = new Logger(UsersInitializer.name);

    constructor(
        private readonly usersService: UsersService,
        private readonly configService: ConfigService,
    ) { }

    async onApplicationBootstrap(): Promise<void> {
        // Crear usuarios fijos de producción
        await this.createProductionUsers();

        // Crear admin por defecto si está configurado (para compatibilidad)
        await this.createDefaultAdminIfConfigured();
    }

    private async createProductionUsers(): Promise<void> {
        const productionUsers = [
            {
                email: 'superadmin@datapulse.local',
                password: 'SuperAdmin2024!',
                name: 'Super Administrator',
                role: UserRole.SuperAdmin,
            },
            {
                email: 'admin@datapulse.local',
                password: 'Admin2024!',
                name: 'Administrator',
                role: UserRole.Admin,
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

    private async createDefaultAdminIfConfigured(): Promise<void> {
        const email = this.configService.get<string>('seed.admin.email');
        const password = this.configService.get<string>('seed.admin.password');
        const name = this.configService.get<string>('seed.admin.name') ?? 'DataPulse Admin';
        const configuredRole = this.configService.get<string>('seed.admin.role');
        const normalizedRole = configuredRole?.toLowerCase() as UserRole | undefined;
        const role = normalizedRole && Object.values(UserRole).includes(normalizedRole)
            ? normalizedRole
            : UserRole.Admin;

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

    private async provisionExperimentalAccounts(): Promise<void> {
        // Experimental user seeding has been disabled for production
        this.logger.log('Experimental user seeding disabled for production environment.');
    }
}
