import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SupabaseClient } from '@supabase/supabase-js';
import { UserEntity } from './entities/user.entity';
export declare class UsersService {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
    private readonly tableName;
    create(input: CreateUserDto): Promise<Omit<UserEntity, 'passwordHash'>>;
    findAll(): Promise<Array<Omit<UserEntity, 'passwordHash'>>>;
    findById(id: string): Promise<Omit<UserEntity, 'passwordHash'>>;
    findByEmail(email: string): Promise<UserEntity | null>;
    update(id: string, changes: UpdateUserDto): Promise<Omit<UserEntity, 'passwordHash'>>;
    remove(id: string): Promise<void>;
    private toPublicUser;
    private toUserEntity;
}
