import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer';
import { DatasetsController } from './datasets.controller';
import { DatasetsService } from './datasets.service';
import { Dataset, DatasetSchema } from './schemas/dataset.schema';
import { AnalysisService } from './analysis.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Dataset.name, schema: DatasetSchema }]),
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        storage: memoryStorage(),
        limits: {
          fileSize: configService.get<number>('uploads.maxFileSize', 5 * 1024 * 1024),
        },
      }),
    }),
  ],
  controllers: [DatasetsController],
  providers: [DatasetsService, AnalysisService],
  exports: [DatasetsService],
})
export class DatasetsModule { }
