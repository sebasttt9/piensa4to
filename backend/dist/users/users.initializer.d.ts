import { OnApplicationBootstrap } from '@nestjs/common/interfaces/hooks/on-application-bootstrap.interface';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
export declare class UsersInitializer implements OnApplicationBootstrap {
    private readonly usersService;
    private readonly configService;
    private readonly logger;
    constructor(usersService: UsersService, configService: ConfigService);
    onApplicationBootstrap(): Promise<void>;
}
