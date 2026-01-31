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
  Res,
  UseGuards,
} from '@nestjs/common';
import { DashboardsService } from './dashboards.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../users/entities/user.entity';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { ShareDashboardDto } from './dto/share-dashboard.dto';
import { ApproveDashboardDto } from './dto/approve-dashboard.dto';
import type { Response } from 'express';

@Controller('dashboards')
@UseGuards(JwtAuthGuard)
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) { }

  @Post()
  create(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>, @Body() dto: CreateDashboardDto) {
    return this.dashboardsService.create(user.id, dto, user.role, user.organizationId);
  }

  @Get()
  async findAll(
    @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 10;
    const skip = (parsedPage - 1) * parsedLimit;
    const [dashboards, total] = await Promise.all([
      this.dashboardsService.findAll(user.id, user.role, skip, parsedLimit, user.organizationId),
      this.dashboardsService.countByUser(user.id, user.role, user.organizationId),
    ]);
    return {
      data: dashboards,
      total,
      page: parsedPage,
      limit: parsedLimit,
    };
  }

  @Get(':id')
  findOne(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>, @Param('id') id: string) {
    return this.dashboardsService.findOne(user.id, id, user.role, user.organizationId);
  }

  @Put(':id')
  update(
    @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
    @Param('id') id: string,
    @Body() dto: UpdateDashboardDto,
  ) {
    return this.dashboardsService.update(user.id, id, dto, user.role, user.organizationId);
  }

  @Patch(':id/share')
  share(
    @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
    @Param('id') id: string,
    @Body() dto: { isPublic: boolean },
  ) {
    return this.dashboardsService.share(user.id, id, dto.isPublic, user.role, user.organizationId);
  }

  @Post(':id/share/invite')
  shareWithContact(
    @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
    @Param('id') id: string,
    @Body() dto: ShareDashboardDto,
  ) {
    return this.dashboardsService.shareWithContact(user.id, id, dto, user.role, user.organizationId);
  }

  @Delete(':id')
  remove(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>, @Param('id') id: string) {
    return this.dashboardsService.remove(user.id, id, user.role, user.organizationId);
  }

  @Get(':id/export')
  async export(
    @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
    @Param('id') id: string,
    @Query('format') format = 'json',
    @Res() res: Response,
  ) {
    const normalizedFormat = format === 'pdf' ? 'pdf' : 'json';
    if (normalizedFormat === 'json') {
      const dashboard = await this.dashboardsService.export(user.id, id, 'json', user.role, user.organizationId);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="dashboard-${id}.json"`);
      return res.send(JSON.stringify(dashboard, null, 2));
    }

    const pdfBuffer = await this.dashboardsService.export(user.id, id, 'pdf', user.role, user.organizationId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="dashboard-${id}.pdf"`);
    return res.send(pdfBuffer);
  }

  @Patch(':id/approve')
  approve(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>, @Param('id') id: string, @Body() dto: ApproveDashboardDto) {
    return this.dashboardsService.approveDashboard(user.id, id, dto.status, user.role, user.organizationId);
  }
}
