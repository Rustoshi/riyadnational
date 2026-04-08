import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { AdminService } from '@/services/adminService';
import { successResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User, Transaction } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    console.log('[Dashboard] Authenticating admin...');
    const { admin, error } = await authenticateAdmin(request);
    console.log('[Dashboard] Auth result:', { adminFound: !!admin, error });
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const stats = await AdminService.getDashboardStats();
    
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email status createdAt')
      .lean();
    
    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type amount status createdAt user')
      .populate('user', 'name')
      .lean();

    return successResponse(
      { 
        ...stats, 
        recentUsers, 
        recentTransactions 
      },
      'Dashboard data retrieved successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}
