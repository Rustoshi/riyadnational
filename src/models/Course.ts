import mongoose, { Schema, Model } from 'mongoose';
import { ICourse, CourseStatus } from '@/types';

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    thumbnail: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    duration: {
      type: Number,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    membership: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
    },
    status: {
      type: String,
      enum: Object.values(CourseStatus),
      default: CourseStatus.DRAFT,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
CourseSchema.index({ status: 1 });
CourseSchema.index({ membership: 1, order: 1 });

// Static methods
CourseSchema.statics.getPublished = function (membershipId?: mongoose.Types.ObjectId) {
  const query: Record<string, unknown> = { status: CourseStatus.PUBLISHED };
  if (membershipId) {
    query.membership = membershipId;
  }
  return this.find(query).sort({ order: 1 });
};

export const Course: Model<ICourse> =
  mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
