import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DatasetsService } from './datasets.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserEntity } from '../users/entities/user.entity';
import { UploadDatasetDto } from './dto/upload-dataset.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/constants/roles.enum';

@Controller('datasets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DatasetsController {
  constructor(
    private readonly datasetsService: DatasetsService,
  ) { }

  @Get()
  async findAll(
    @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const parsedPage = Number(page) || 1;
    const parsedLimit = Number(limit) || 10;
    const skip = (parsedPage - 1) * parsedLimit;
    const [datasets, total] = await Promise.all([
      this.datasetsService.findAll(user.id, skip, parsedLimit),
      this.datasetsService.countByUser(user.id),
    ]);
    return {
      data: datasets,
      total,
      page: parsedPage,
      limit: parsedLimit,
    };
  }

  @Get(':id')
  findOne(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>, @Param('id') id: string) {
    return this.datasetsService.findOne(user.id, id);
  }

  @Post()
  @Roles(UserRole.Admin)
  create(
    @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
    @Body() dto: UploadDatasetDto,
  ) {
    return this.datasetsService.create(user.id, dto);
  }

  @Put(':id')
  @Roles(UserRole.Admin)
  update(
    @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
    @Param('id') id: string,
    @Body() dto: Partial<UploadDatasetDto>,
  ) {
    return this.datasetsService.update(user.id, id, dto);
  }

  @Post(':id/upload')
  @Roles(UserRole.Admin)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.datasetsService.uploadDataset(user.id, id, file);
  }

  @Get(':id/preview')
  async getPreview(
    @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
    @Param('id') id: string,
    @Query('limit') limit = 50,
  ) {
    const dataset = await this.datasetsService.findOne(user.id, id);
    const preview = await this.datasetsService.getPreview(id, Number(limit));
    const columns = preview.length > 0 ? Object.keys(preview[0]) : [];
    return {
      data: preview,
      columns,
      total: dataset.rowCount || 0,
    };
  }

  @Get(':id/analyze')
  analyzeDataset(
    @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
    @Param('id') id: string,
  ) {
    // TODO: Implement analysis
    return { datasetId: id, message: 'Analysis coming soon' };
  }

  @Get(':id/insights')
  getInsights(
    @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
    @Param('id') id: string,
  ) {
    // TODO: Implement insights
    return { datasetId: id, message: 'Insights coming soon' };
  }

  @Get(':id/report')
  async generateReport(
    @CurrentUser() user: Omit<UserEntity, 'passwordHash'>,
    @Param('id') id: string,
    @Query('format') format: 'json' | 'pdf' = 'json',
  ) {
    // Validate dataset ownership
    await this.datasetsService.findOne(user.id, id);

    if (format === 'json') {
      return { datasetId: id, message: 'JSON report coming soon' };
    }

    // PDF generation can be implemented with libraries like PDFKit or puppeteer
    throw new BadRequestException('PDF export coming soon');
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  remove(@CurrentUser() user: Omit<UserEntity, 'passwordHash'>, @Param('id') id: string) {
    return this.datasetsService.remove(user.id, id);
  }
}
