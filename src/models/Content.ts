import mongoose, { Schema, Model } from 'mongoose';

export interface IContent {
  _id: mongoose.Types.ObjectId;
  key: string;
  title?: string;
  content: string;
  type: 'text' | 'html' | 'json';
  updatedAt: Date;
}

const ContentSchema = new Schema<IContent>(
  {
    key: {
      type: String,
      required: [true, 'Key is required'],
      unique: true,
    },
    title: {
      type: String,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    type: {
      type: String,
      enum: ['text', 'html', 'json'],
      default: 'text',
    },
  },
  {
    timestamps: true,
  }
);

export const Content: Model<IContent> =
  mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);

export default Content;
