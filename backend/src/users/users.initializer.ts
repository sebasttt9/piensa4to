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
        const email = this.configService.get<string>('seed.admin.email');
        const password = this.configService.get<string>('seed.admin.password');
        const name = this.configService.get<string>('seed.admin.name') ?? 'DataPulse Admin';
        const configuredRole = this.configService.get<string>('seed.admin.role');
        const normalizedRole = configuredRole?.toLowerCase() as UserRole | undefined;
        const role = normalizedRole && Object.values(UserRole).includes(normalizedRole)
            ? normalizedRole
            : UserRole.Admin;

        if (!email || !password) {
            this.logger.warn('Default admin credentials are not configured. Skipping bootstrap user creation.');
            try {
                await this.provisionExperimentalAccounts();
            } catch (error) {
                this.logger.error('Failed to provision experimental accounts:', error);
            }
            return;
        }

        const existing = await this.usersService.findByEmail(email);
        if (existing) {
            this.logger.log(`Default admin '${email}' already exists.`);
        } else {
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

    private async provisionExperimentalAccounts(): Promise<void> {
        const experimentalSeed = this.configService.get<ExperimentalSeedConfig>('seed.experimentalUsers');
        if (!experimentalSeed?.enabled) {
            this.logger.log('Experimental user seeding disabled.');
            return;
        }

        const accounts = experimentalSeed.users ?? [];
        if (accounts.length === 0) {
            this.logger.warn('Experimental user seeding enabled but no accounts configured.');
            return;
        }

        const allowedRoles = new Set<string>(Object.values(UserRole));

        for (const account of accounts) {
            const email = account.email?.toLowerCase()?.trim();
            const password = account.password;
            const name = account.name?.trim() ?? 'DataPulse Demo';
            const configuredRole = account.role?.toLowerCase() ?? UserRole.User;
            const role = allowedRoles.has(configuredRole) ? configuredRole as UserRole : UserRole.User;

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
}
