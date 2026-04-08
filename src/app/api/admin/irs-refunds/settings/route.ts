import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { IrsRefundSetting } from '@/models';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';

// GET /api/admin/irs-refunds/settings - Get IRS refund settings
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    // Get or create settings
    let settings = await IrsRefundSetting.findOne();
    if (!settings) {
      settings = await IrsRefundSetting.create({});
    }

    return successResponse(settings, 'IRS refund settings retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}

// PUT /api/admin/irs-refunds/settings - Update IRS refund settings
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const {
      minAmount,
      maxAmount,
      processingFee,
      processingTime,
      instructions,
      enableRefunds,
      requireVerification,
    } = body;

    // Validate
    if (minAmount !== undefined && minAmount < 0) {
      return errorResponse('Minimum amount cannot be negative', 400);
    }
    if (maxAmount !== undefined && maxAmount < 0) {
      return errorResponse('Maximum amount cannot be negative', 400);
    }
    if (maxAmount !== undefined && minAmount !== undefined && maxAmount <= minAmount) {
      return errorResponse('Maximum amount must be greater than minimum amount', 400);
    }
    if (processingFee !== undefined && (processingFee < 0 || processingFee > 100)) {
      return errorResponse('Processing fee must be between 0 and 100', 400);
    }
    if (processingTime !== undefined && processingTime < 1) {
      return errorResponse('Processing time must be at least 1 day', 400);
    }

    // Get or create settings
    let settings = await IrsRefundSetting.findOne();
    if (!settings) {
      settings = await IrsRefundSetting.create({});
    }

    // Update fields
    if (minAmount !== undefined) settings.minAmount = minAmount;
    if (maxAmount !== undefined) settings.maxAmount = maxAmount;
    if (processingFee !== undefined) settings.processingFee = processingFee;
    if (processingTime !== undefined) settings.processingTime = processingTime;
    if (instructions !== undefined) settings.instructions = instructions;
    if (enableRefunds !== undefined) settings.enableRefunds = enableRefunds;
    if (requireVerification !== undefined) settings.requireVerification = requireVerification;

    await settings.save();

    return successResponse(settings, 'Settings updated successfully');
  } catch (error) {
    return handleError(error);
  }
}
