import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Dashboard, DashboardDocument } from './schemas/dashboard.schema';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { DatasetsService } from '../datasets/datasets.service';

@Injectable()
export class DashboardsService {
  constructor(
    @InjectModel(Dashboard.name)
    private readonly dashboardModel: Model<DashboardDocument>,
    private readonly datasetsService: DatasetsService,
  ) { }

  async create(ownerId: string, dto: CreateDashboardDto): Promise<DashboardDocument> {
    // Validate dataset ownership
    if (dto.datasetIds && dto.datasetIds.length > 0) {
      for (const datasetId of dto.datasetIds) {
        await this.datasetsService.findOne(ownerId, datasetId);
      }
    }

    const dashboard = new this.dashboardModel({
      owner: new Types.ObjectId(ownerId),
      name: dto.name,
      description: dto.description,
      datasetIds: (dto.datasetIds || []).map((id) => new Types.ObjectId(id)),
      layout: {},
      charts: [],
      isPublic: false,
    });

    return dashboard.save();
  }

  async findAll(
    ownerId: string,
    skip = 0,
    limit = 10,
  ): Promise<DashboardDocument[]> {
    return this.dashboardModel
      .find({ owner: ownerId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async countByUser(ownerId: string): Promise<number> {
    return this.dashboardModel.countDocuments({ owner: ownerId });
  }

  async findOne(ownerId: string, id: string): Promise<DashboardDocument> {
    const dashboard = await this.dashboardModel
      .findOne({ _id: id, owner: ownerId })
      .exec();

    if (!dashboard) {
      throw new NotFoundException('Dashboard no encontrado');
    }

    return dashboard;
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateDashboardDto,
  ): Promise<DashboardDocument> {
    const { datasetIds, ...rest } = dto;

    // Validate new dataset ownership
    if (datasetIds && datasetIds.length > 0) {
      for (const datasetId of datasetIds) {
        await this.datasetsService.findOne(ownerId, datasetId);
      }
    }

    const updatePayload: any = { ...rest };

    if (datasetIds) {
      updatePayload.datasetIds = datasetIds.map((id) => new Types.ObjectId(id));
    }

    const dashboard = await this.dashboardModel
      .findOneAndUpdate({ _id: id, owner: ownerId }, updatePayload, {
        new: true,
        runValidators: true,
      })
      .exec();

    if (!dashboard) {
      throw new NotFoundException('Dashboard no encontrado');
    }

    return dashboard;
  }

  async share(
    ownerId: string,
    id: string,
    isPublic: boolean,
  ): Promise<DashboardDocument> {
    const dashboard = await this.dashboardModel
      .findOneAndUpdate({ _id: id, owner: ownerId }, { isPublic }, { new: true })
      .exec();

    if (!dashboard) {
      throw new NotFoundException('Dashboard no encontrado');
    }

    return dashboard;
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const result = await this.dashboardModel.deleteOne({
      _id: id,
      owner: ownerId,
    });

    if (!result.deletedCount) {
      throw new NotFoundException('Dashboard no encontrado');
    }
  }
}
