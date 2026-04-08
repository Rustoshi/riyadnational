import mongoose, { Schema, Model } from 'mongoose';
import { INotification, NotificationType } from '@/types';

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.INFO,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
NotificationSchema.index({ user: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

// Static method to get user notifications
NotificationSchema.statics.getUserNotifications = function (
  userId: mongoose.Types.ObjectId,
  options: { limit?: number; skip?: number; unreadOnly?: boolean } = {}
) {
  const query: Record<string, unknown> = { user: userId };
  if (options.unreadOnly) {
    query.isRead = false;
  }
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(options.skip || 0)
    .limit(options.limit || 20);
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = function (
  userId: mongoose.Types.ObjectId
) {
  return this.countDocuments({ user: userId, isRead: false });
};

// Static method to mark all as read
NotificationSchema.statics.markAllAsRead = function (
  userId: mongoose.Types.ObjectId
) {
  return this.updateMany({ user: userId, isRead: false }, { isRead: true });
};

// Static method to create notification
NotificationSchema.statics.createNotification = async function (
  userId: mongoose.Types.ObjectId,
  title: string,
  message: string,
  type: NotificationType = NotificationType.INFO,
  link?: string
) {
  return this.create({
    user: userId,
    title,
    message,
    type,
    link,
  });
};

// Prevent model recompilation in development
const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
