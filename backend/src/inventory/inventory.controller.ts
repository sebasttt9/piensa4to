import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../users/entities/user.entity';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants/roles.enum';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get()
    getSummary(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>) {
        return this.inventoryService.getInventory(user.id);
    }

    @Post(':datasetId/adjust')
    @Roles(UserRole.Admin)
    adjustInventory(
        @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
        @Param('datasetId') datasetId: string,
        @Body() body: AdjustInventoryDto,
    ) {
        return this.inventoryService.adjustInventory(user.id, datasetId, body.amount);
    }

    @Delete('adjustments')
    @Roles(UserRole.Admin)
    resetAdjustments(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>) {
        return this.inventoryService.resetAdjustments(user.id);
    }
}
