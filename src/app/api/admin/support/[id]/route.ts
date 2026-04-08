import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import SupportTicket, { TicketStatus } from '@/models/SupportTicket';
import { Notification, Activity } from '@/models';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { NotificationType, ActivityActorType } from '@/types';

// GET - Get single ticket details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { admin, error } = await authenticateAdmin(request);
        if (error || !admin) {
            return unauthorizedResponse(error || 'Unauthorized');
        }

        const { id } = await params;
        const ticket = await SupportTicket.findById(id).populate('user', 'name email profilePhoto').lean();

        if (!ticket) {
            return notFoundResponse('Ticket not found');
        }

        return successResponse({ ticket }, 'Ticket retrieved successfully');
    } catch (error) {
        return handleError(error);
    }
}

// PUT - Reply to or update support ticket
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();

        const { admin, error } = await authenticateAdmin(request);
        if (error || !admin) {
            return unauthorizedResponse(error || 'Unauthorized');
        }

        const { id } = await params;
        const body = await request.json();
        const { status, adminResponse } = body;

        const ticket = await SupportTicket.findById(id);
        if (!ticket) {
            return notFoundResponse('Ticket not found');
        }

        let updated = false;

        // Update status if provided
        if (status && Object.values(TicketStatus).includes(status)) {
            ticket.status = status;
            updated = true;
        }

        // Add admin response if provided
        if (adminResponse) {
            ticket.adminResponse = adminResponse;
            ticket.respondedBy = admin._id;
            ticket.respondedAt = new Date();
            ticket.status = TicketStatus.RESOLVED; // Auto-resolve on response, unless specified otherwise
            updated = true;
        }

        if (updated) {
            await ticket.save();

            // Notify user
            if (adminResponse) {
                await Notification.create({
                    user: ticket.user,
                    type: NotificationType.SUCCESS,
                    title: 'Support Ticket Updated',
                    message: `Admin has responded to your ticket #${ticket.ticketNumber}`,
                    link: `/dashboard/support`,
                });
            } else if (status) {
                await Notification.create({
                    user: ticket.user,
                    type: NotificationType.INFO,
                    title: 'Support Ticket Status Changed',
                    message: `Your ticket #${ticket.ticketNumber} status has been updated to ${status.replace('_', ' ')}`,
                    link: `/dashboard/support`,
                });
            }

            // Log activity
            await Activity.create({
                actor: admin._id,
                actorType: ActivityActorType.ADMIN,
                action: 'update_ticket',
                resource: 'ticket',
                resourceId: ticket._id,
                details: { ticketNumber: ticket.ticketNumber, status: ticket.status },
            });
        }

        return successResponse({ ticket }, 'Ticket updated successfully');
    } catch (error) {
        return handleError(error);
    }
}
