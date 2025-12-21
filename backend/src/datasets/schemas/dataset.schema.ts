import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { DatasetAnalysis } from '../interfaces/dataset-analysis.interface';
import { User } from '../../users/schemas/user.schema';

@Schema({ timestamps: true })
export class Dataset {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  owner: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: false })
  filename?: string;

  @Prop({ required: false })
  fileSize?: number;

  @Prop({ required: false, enum: ['csv', 'xlsx'] })
  fileType?: 'csv' | 'xlsx';

  @Prop({ required: false, type: Number })
  rowCount?: number;

  @Prop({ required: false, type: Number })
  columnCount?: number;

  @Prop({ type: Object, default: {} })
  analysis?: DatasetAnalysis;

  @Prop({ type: Array, default: [] })
  preview: Record<string, unknown>[];

  @Prop({
    type: String,
    enum: ['pending', 'processed', 'error'],
    default: 'pending'
  })
  status: 'pending' | 'processed' | 'error';

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export type DatasetDocument = HydratedDocument<Dataset>;

export const DatasetSchema = SchemaFactory.createForClass(Dataset);

DatasetSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret: Partial<Dataset> & { _id?: Types.ObjectId }) => {
    if (ret._id) {
      (ret as { id?: string }).id = ret._id.toString();
      delete ret._id;
    }
    return ret;
  },
});
