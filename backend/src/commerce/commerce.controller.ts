import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CommerceService, type CommerceOverview } from './commerce.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../users/entities/user.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants/roles.enum';

@Controller('commerce')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommerceController {
    constructor(private readonly commerceService: CommerceService) { }

    @Get('overview')
    @Roles(UserRole.User, UserRole.Admin)
    getOverview(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>): Promise<CommerceOverview> {
        return this.commerceService.getOverview(user.id, user.organizationId);
    }
}
