import { Injectable, Logger } from '@nestjs/common';
import { OnApplicationBootstrap } from '@nestjs/common/interfaces/hooks/on-application-bootstrap.interface';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../common/constants/roles.enum';
import { UsersService } from './users.service';

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
        const role = configuredRole === UserRole.User ? UserRole.User : UserRole.Admin;

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
}
