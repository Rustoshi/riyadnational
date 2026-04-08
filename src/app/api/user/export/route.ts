import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ExportService } from '@/services/exportService';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'transactions';
    const format = searchParams.get('format') || 'csv';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    if (format === 'json' && type === 'all') {
      // Export all user data as JSON (GDPR)
      const data = await ExportService.exportUserData(user._id.toString());
      return successResponse(data, 'User data exported successfully');
    }

    let csv: string;
    let filename: string;

    switch (type) {
      case 'transactions':
        csv = await ExportService.exportUserTransactions(user._id.toString(), options);
        filename = 'transactions.csv';
        break;
      default:
        return errorResponse('Invalid export type', 400);
    }

    // Return CSV file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
