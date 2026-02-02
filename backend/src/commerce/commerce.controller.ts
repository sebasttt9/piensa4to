import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';import { Controller, Get, UseGuards } from '@nestjs/common';    }        return this.commerceService.registerSale(user.id, user.organizationId, dto);    ) {        @Body() dto: RegisterSaleDto,        @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,    registerSale(    @Roles(UserRole.User, UserRole.Admin)    @Post('sales')    }        return this.commerceService.getOverview(user.id, user.organizationId);    getOverview(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>): Promise<CommerceOverview> {    @Roles(UserRole.User, UserRole.Admin)    @Get('overview')    constructor(private readonly commerceService: CommerceService) { }export class CommerceController {@UseGuards(JwtAuthGuard, RolesGuard)@Controller('commerce')import { RegisterSaleDto } from './dto/register-sale.dto';import { UserRole } from '../common/constants/roles.enum';import { Roles } from '../common/decorators/roles.decorator';import type { UserEntity } from '../users/entities/user.entity';import { CurrentUser } from '../common/decorators/current-user.decorator';import { CommerceService, type CommerceOverview } from './commerce.service';import { RolesGuard } from '../common/guards/roles.guard';import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
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
