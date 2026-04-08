import mongoose, { Schema, Model } from 'mongoose';
import { IActivity, ActivityActorType } from '@/types';

const ActivitySchema = new Schema<IActivity>(
  {
    actor: {
      type: Schema.Types.ObjectId,
      refPath: 'actorType',
      required: [true, 'Actor is required'],
      index: true,
    },
    actorType: {
      type: String,
      enum: Object.values(ActivityActorType),
      required: [true, 'Actor type is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
    },
    resource: {
      type: String,
      required: [true, 'Resource is required'],
    },
    resourceId: {
      type: Schema.Types.ObjectId,
    },
    details: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ actor: 1, createdAt: -1 });
ActivitySchema.index({ resource: 1, resourceId: 1 });

// TTL index to auto-delete old activities (90 days)
ActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static method to log activity
ActivitySchema.statics.log = async function (
  actor: mongoose.Types.ObjectId,
  actorType: ActivityActorType,
  action: string,
  resource: string,
  resourceId?: mongoose.Types.ObjectId,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  return this.create({
    actor,
    actorType,
    action,
    resource,
    resourceId,
    details,
    ipAddress,
    userAgent,
  });
};

// Static method to get recent activities
ActivitySchema.statics.getRecent = function (
  options: { limit?: number; skip?: number; actorType?: ActivityActorType } = {}
) {
  const query: Record<string, unknown> = {};
  if (options.actorType) {
    query.actorType = options.actorType;
  }
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 50);
};

// Static method to get actor activities
ActivitySchema.statics.getActorActivities = function (
  actorId: mongoose.Types.ObjectId,
  options: { limit?: number; skip?: number } = {}
) {
  return this.find({ actor: actorId })
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 50);
};

// Prevent model recompilation in development
const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);

export default Activity;
