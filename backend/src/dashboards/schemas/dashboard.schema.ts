import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Dataset } from '../../datasets/schemas/dataset.schema';

@Schema({ _id: false })
export class DashboardChart {
  @Prop({ required: true })
  type: string;

  @Prop({ trim: true })
  title?: string;

  @Prop({ type: Object, default: {} })
  config: Record<string, unknown>;
}

const DashboardChartSchema = SchemaFactory.createForClass(DashboardChart);

@Schema({ timestamps: true })
export class Dashboard {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  owner: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [Types.ObjectId], ref: Dataset.name, default: [] })
  datasetIds: Types.ObjectId[];

  @Prop({ type: Object, default: {} })
  layout: Record<string, unknown>;

  @Prop({ type: [DashboardChartSchema], default: [] })
  charts: DashboardChart[];

  @Prop({ default: false })
  isPublic: boolean;
}

export type DashboardDocument = HydratedDocument<Dashboard>;

export const DashboardSchema = SchemaFactory.createForClass(Dashboard);

DashboardSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: Partial<Dashboard> & { _id?: Types.ObjectId }) => {
    if (ret._id) {
      (ret as { id?: string }).id = ret._id.toString();
      delete ret._id;
    }
    return ret;
  },
});
