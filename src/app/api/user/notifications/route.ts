import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { NotificationService } from '@/services/notificationService';
import { successResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const { notifications, total, unreadCount } = await NotificationService.getUserNotifications(
      user._id.toString(),
      { page, limit, unreadOnly }
    );

    return successResponse(
      {
        notifications,
        pagination: createPaginationResponse(total, page, limit),
        unreadCount,
      },
      'Notifications retrieved successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { action, notificationId } = body;

    if (action === 'markAllRead') {
      const count = await NotificationService.markAllAsRead(user._id.toString());
      return successResponse({ count }, `${count} notifications marked as read`);
    }

    if (action === 'markRead' && notificationId) {
      const notification = await NotificationService.markAsRead(notificationId, user._id.toString());
      return successResponse(notification, 'Notification marked as read');
    }

    if (action === 'deleteAllRead') {
      const count = await NotificationService.deleteAllRead(user._id.toString());
      return successResponse({ count }, `${count} notifications deleted`);
    }

    return successResponse(null, 'No action taken');
  } catch (error) {
    return handleError(error);
  }
}
