import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';

@Controller('dashboards')
@UseGuards(JwtAuthGuard)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) { }

  @Post()
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateDashboardDto) {
    return this.dashboardsService.create(user.id, dto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: UserDocument,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const skip = (page - 1) * limit;
    const [dashboards, total] = await Promise.all([
      this.dashboardsService.findAll(user.id, skip, limit),
      this.dashboardsService.countByUser(user.id),
    ]);
    return {
      data: dashboards,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  @Get(':id')
  findOne(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.dashboardsService.findOne(user.id, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: UpdateDashboardDto,
  ) {
    return this.dashboardsService.update(user.id, id, dto);
  }

  @Patch(':id/share')
  share(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: { isPublic: boolean },
  ) {
    return this.dashboardsService.share(user.id, id, dto.isPublic);
  }

  @Delete(':id')
  remove(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.dashboardsService.remove(user.id, id);
  }
}
