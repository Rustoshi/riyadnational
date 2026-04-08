import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import SupportTicket, { TicketPriority } from '@/models/SupportTicket';
import { Notification } from '@/models';
import { successResponse, errorResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { NotificationType } from '@/types';

// GET - Fetch user's support tickets
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      SupportTicket.find({ user: user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments({ user: user._id }),
    ]);

    return successResponse({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { subject, message, priority } = body;

    if (!subject || !message) {
      return errorResponse('Subject and message are required', 400);
    }

    if (subject.length > 200) {
      return errorResponse('Subject cannot exceed 200 characters', 400);
    }

    if (message.length > 2000) {
      return errorResponse('Message cannot exceed 2000 characters', 400);
    }

    // Validate priority
    const validPriority = Object.values(TicketPriority).includes(priority)
      ? priority
      : TicketPriority.MEDIUM;

    // Create the support ticket
    const ticket = await SupportTicket.create({
      user: user._id,
      subject,
      message,
      priority: validPriority,
    });

    // Create notification for user
    await Notification.create({
      user: user._id,
      type: NotificationType.INFO,
      title: 'Support Ticket Created',
      message: `Your support ticket #${ticket.ticketNumber} has been submitted. Our team will respond within 24 hours.`,
      link: `/dashboard/support/${ticket._id}`,
    });

    return successResponse(ticket, 'Support ticket submitted successfully');
  } catch (error) {
    return handleError(error);
  }
}
