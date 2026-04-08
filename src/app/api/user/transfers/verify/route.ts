import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { User, Transfer } from '@/models';
import { TransferStatus } from '@/types';

// Verify IMF/COT/OTP codes for a transfer
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { transferId, step, code } = body;

    if (!transferId || !step || !code) {
      return errorResponse('Transfer ID, step, and code are required', 400);
    }

    const transfer = await Transfer.findById(transferId);
    if (!transfer) {
      return errorResponse('Transfer not found', 404);
    }

    if (transfer.sender.toString() !== user._id.toString()) {
      return errorResponse('Unauthorized', 403);
    }

    if (transfer.status !== TransferStatus.PENDING) {
      return errorResponse('Transfer is not pending verification', 400);
    }

    const fullUser = await User.findById(user._id);
    if (!fullUser) {
      return errorResponse('User not found', 404);
    }

    // Verify based on step
    switch (step) {
      case 'imf':
        if (!fullUser.imfCode) {
          return errorResponse('IMF Code not set for your account. Please contact support.', 400);
        }
        if (code !== fullUser.imfCode) {
          return errorResponse('Invalid IMF Code. Please check and try again.', 400);
        }
        // Mark IMF as verified in transfer metadata
        transfer.metadata = {
          ...transfer.metadata,
          imfVerified: true,
          imfVerifiedAt: new Date(),
        };
        await transfer.save();
        return successResponse({ nextStep: 'cot' }, 'IMF Code verified successfully');

      case 'cot':
        if (!fullUser.cotCode) {
          return errorResponse('COT Code not set for your account. Please contact support.', 400);
        }
        if (code !== fullUser.cotCode) {
          return errorResponse('Invalid COT Code. Please check and try again.', 400);
        }
        // Mark COT as verified
        transfer.metadata = {
          ...transfer.metadata,
          cotVerified: true,
          cotVerifiedAt: new Date(),
        };
        await transfer.save();
        return successResponse({ nextStep: 'otp' }, 'COT Code verified successfully');

      case 'otp':
        // Verify OTP from transfer metadata
        const storedOtp = transfer.metadata?.otp as string | undefined;
        const otpExpiry = transfer.metadata?.otpExpiry as string | Date | undefined;
        
        if (!storedOtp || !otpExpiry) {
          return errorResponse('OTP not found. Please request a new OTP.', 400);
        }
        
        if (new Date() > new Date(otpExpiry as string | Date)) {
          return errorResponse('OTP has expired. Please request a new OTP.', 400);
        }
        
        if (code !== storedOtp) {
          return errorResponse('Invalid OTP. Please check and try again.', 400);
        }
        
        // Mark OTP as verified and complete the transfer verification
        transfer.metadata = {
          ...transfer.metadata,
          otpVerified: true,
          otpVerifiedAt: new Date(),
        };
        transfer.codesVerified = true;
        transfer.status = TransferStatus.PROCESSING;
        await transfer.save();
        
        return successResponse({ nextStep: 'complete', transferId: transfer._id }, 'OTP verified successfully. Transfer is now being processed.');

      default:
        return errorResponse('Invalid verification step', 400);
    }
  } catch (error) {
    return handleError(error);
  }
}
