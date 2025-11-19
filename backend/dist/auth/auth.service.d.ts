import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserDocument } from '../users/schemas/user.schema';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly jwtExpiration;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: UserDocument;
    }>;
    login({ email, password }: LoginDto): Promise<{
        accessToken: string;
        user: UserDocument;
    }>;
    private buildToken;
}
