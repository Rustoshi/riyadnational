import mongoose, { Schema, Model } from 'mongoose';
import { ITask, TaskStatus, TaskPriority } from '@/types';

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    description: {
      type: String,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    relatedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      default: TaskPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
    },
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ dueDate: 1 });

// Static methods
TaskSchema.statics.getByAssignee = function (
  adminId: mongoose.Types.ObjectId,
  status?: TaskStatus
) {
  const query: Record<string, unknown> = { assignedTo: adminId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('assignedBy', 'name email')
    .populate('relatedUser', 'name email')
    .sort({ priority: -1, dueDate: 1 });
};

TaskSchema.statics.getPending = function () {
  return this.find({ status: { $in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] } })
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email')
    .sort({ priority: -1, dueDate: 1 });
};

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
