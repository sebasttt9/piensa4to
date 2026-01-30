import { UserRole } from '../../common/constants/roles.enum';

export interface UserEntity {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    passwordHash?: string;
    approved: boolean;
    createdAt: string;
    updatedAt: string;
}
