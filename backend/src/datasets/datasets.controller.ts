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
import type { UserDocument } from '../users/schemas/user.schema';
import { UploadDatasetDto } from './dto/upload-dataset.dto';

@Controller('datasets')
@UseGuards(JwtAuthGuard)
export class DatasetsController {
  constructor(
    private readonly datasetsService: DatasetsService,
  ) { }

  @Get()
  async findAll(
    @CurrentUser() user: UserDocument,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const skip = (page - 1) * limit;
    const [datasets, total] = await Promise.all([
      this.datasetsService.findAll(user.id, skip, limit),
      this.datasetsService.countByUser(user.id),
    ]);
    return {
      data: datasets,
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }

  @Get(':id')
  findOne(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.datasetsService.findOne(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: UserDocument,
    @Body() dto: UploadDatasetDto,
  ) {
    return this.datasetsService.create(user.id, dto);
  }

  @Put(':id')
  update(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: Partial<UploadDatasetDto>,
  ) {
    return this.datasetsService.update(user.id, id, dto);
  }

  @Post(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @CurrentUser() user: UserDocument,
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
    @CurrentUser() user: UserDocument,
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
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ) {
    // TODO: Implement analysis
    return { datasetId: id, message: 'Analysis coming soon' };
  }

  @Get(':id/insights')
  getInsights(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ) {
    // TODO: Implement insights
    return { datasetId: id, message: 'Insights coming soon' };
  }

  @Get(':id/report')
  async generateReport(
    @CurrentUser() user: UserDocument,
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
  remove(@CurrentUser() user: UserDocument, @Param('id') id: string) {
    return this.datasetsService.remove(user.id, id);
  }
}
