import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { UserEntity } from './entities/user.entity';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: Omit<UserEntity, 'passwordHash'>): Omit<UserEntity, "passwordHash">;
    findAll(): Promise<Omit<UserEntity, "passwordHash">[]>;
    findOne(id: string): Promise<Omit<UserEntity, "passwordHash">>;
    update(id: string, dto: UpdateUserDto): Promise<Omit<UserEntity, "passwordHash">>;
    remove(id: string): Promise<void>;
    resetPassword(id: string, dto: ResetPasswordDto): Promise<Omit<UserEntity, "passwordHash">>;
    create(dto: CreateUserDto): Promise<Omit<UserEntity, "passwordHash">>;
}
