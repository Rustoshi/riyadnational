import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import SupportTicket, { TicketStatus } from '@/models/SupportTicket';
import { successResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';

// GET - List all support tickets for admin
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { admin, error } = await authenticateAdmin(request);
        if (error || !admin) {
            return unauthorizedResponse(error || 'Unauthorized');
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const status = searchParams.get('status') as TicketStatus | undefined;
        const search = searchParams.get('search');

        const skip = (page - 1) * limit;

        const query: any = {};
        if (status) {
            query.status = status;
        }

        if (search) {
            query.$or = [
                { ticketNumber: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } },
            ];
        }

        const [tickets, total] = await Promise.all([
            SupportTicket.find(query)
                .populate('user', 'name email profilePhoto')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            SupportTicket.countDocuments(query),
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
