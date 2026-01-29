import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../users/entities/user.entity';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants/roles.enum';
import { CreateInventoryItemDto, UpdateInventoryItemDto } from './dto/inventory-item.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get()
    getSummary(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>) {
        return this.inventoryService.getInventory(user.id);
    }

    @Post(':datasetId/adjust')
    @Roles(UserRole.User)
    adjustInventory(
        @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
        @Param('datasetId') datasetId: string,
        @Body() body: AdjustInventoryDto,
    ) {
        return this.inventoryService.adjustInventory(user.id, datasetId, body.amount);
    }

    @Delete('adjustments')
    @Roles(UserRole.User)
    resetAdjustments(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>) {
        return this.inventoryService.resetAdjustments(user.id);
    }

    // Inventory Items endpoints
    @Post('items')
    @Roles(UserRole.User)
    createItem(
        @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
        @Body() dto: CreateInventoryItemDto,
    ) {
        return this.inventoryService.createItem(user.id, dto);
    }

    @Get('items')
    @Roles(UserRole.User)
    getItems(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>) {
        return this.inventoryService.getItems(user.id);
    }

    @Get('items/:id')
    @Roles(UserRole.User)
    getItem(
        @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
        @Param('id') itemId: string,
    ) {
        return this.inventoryService.getItem(user.id, itemId);
    }

    @Put('items/:id')
    @Roles(UserRole.User)
    updateItem(
        @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
        @Param('id') itemId: string,
        @Body() dto: UpdateInventoryItemDto,
    ) {
        return this.inventoryService.updateItem(user.id, itemId, dto);
    }

    @Delete('items/:id')
    @Roles(UserRole.User)
    deleteItem(
        @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
        @Param('id') itemId: string,
    ) {
        return this.inventoryService.deleteItem(user.id, itemId);
    }
}
