import { Types } from 'mongoose';
import { Notification } from '@/models';
import { INotification, NotificationType } from '@/types';

export class NotificationService {
  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    const { page = 1, limit = 20, unreadOnly } = options;
    const query: Record<string, unknown> = { user: new Types.ObjectId(userId) };
    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: new Types.ObjectId(userId), isRead: false }),
    ]);

    return { notifications, total, unreadCount };
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.isRead = true;
    await notification.save();

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { user: new Types.ObjectId(userId), isRead: false },
      { isRead: true }
    );

    return result.modifiedCount;
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await Notification.findOne({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await Notification.findByIdAndDelete(notificationId);
  }

  /**
   * Delete all read notifications
   */
  static async deleteAllRead(userId: string): Promise<number> {
    const result = await Notification.deleteMany({
      user: new Types.ObjectId(userId),
      isRead: true,
    });

    return result.deletedCount;
  }

  /**
   * Create notification
   */
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    link?: string
  ): Promise<INotification> {
    return Notification.create({
      user: new Types.ObjectId(userId),
      title,
      message,
      type,
      link,
    });
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({
      user: new Types.ObjectId(userId),
      isRead: false,
    });
  }

  /**
   * Admin: Send notification to user
   */
  static async sendToUser(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO
  ): Promise<INotification> {
    return Notification.create({
      user: new Types.ObjectId(userId),
      title,
      message,
      type,
    });
  }

  /**
   * Admin: Send notification to all users
   */
  static async sendToAllUsers(
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
    userIds: string[]
  ): Promise<number> {
    const notifications = userIds.map((userId) => ({
      user: new Types.ObjectId(userId),
      title,
      message,
      type,
    }));

    const result = await Notification.insertMany(notifications);
    return result.length;
  }
}

export default NotificationService;
