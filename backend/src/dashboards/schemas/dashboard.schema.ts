import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Dataset } from '../../datasets/schemas/dataset.schema';

@Schema({ _id: false })
export class ChartConfig {
  @Prop({ required: true })
  type: string;

  @Prop()
  title?: string;

  @Prop({ type: Object, required: true })
  settings: Record<string, unknown>;
}

export const ChartConfigSchema = SchemaFactory.createForClass(ChartConfig);

@Schema({ timestamps: true })
export class Dashboard {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  owner: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Dataset.name, required: true })
  dataset: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [ChartConfigSchema], default: [] })
  charts: ChartConfig[];

  @Prop({ type: Object, default: {} })
  filters: Record<string, unknown>;
}

export type DashboardDocument = HydratedDocument<Dashboard>;

export const DashboardSchema = SchemaFactory.createForClass(Dashboard);
