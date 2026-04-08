import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { KycService } from '@/services/kycService';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { DocumentType } from '@/types';
import { uploadBase64ToCloudinary, isCloudinaryConfigured } from '@/lib/cloudinary';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const kyc = await KycService.getUserKyc(user._id.toString());

    return successResponse(kyc, 'KYC status retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { documentType, documentNumber, frontImage, backImage, selfieImage } = body;

    if (!documentType || !documentNumber || !frontImage || !selfieImage) {
      return errorResponse('Document type, number, front image, and selfie are required', 400);
    }

    // Upload images to Cloudinary if configured, otherwise store base64
    let frontImageUrl = frontImage;
    let backImageUrl = backImage;
    let selfieImageUrl = selfieImage;

    if (isCloudinaryConfigured()) {
      try {
        const userId = user._id.toString();
        
        // Upload front image
        const frontResult = await uploadBase64ToCloudinary(frontImage, {
          folder: `kyc/${userId}`,
          publicId: `front_${Date.now()}`,
        });
        frontImageUrl = frontResult.secure_url;

        // Upload back image if provided
        if (backImage) {
          const backResult = await uploadBase64ToCloudinary(backImage, {
            folder: `kyc/${userId}`,
            publicId: `back_${Date.now()}`,
          });
          backImageUrl = backResult.secure_url;
        }

        // Upload selfie
        const selfieResult = await uploadBase64ToCloudinary(selfieImage, {
          folder: `kyc/${userId}`,
          publicId: `selfie_${Date.now()}`,
        });
        selfieImageUrl = selfieResult.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return errorResponse('Failed to upload images. Please try again.', 500);
      }
    }

    const kyc = await KycService.submitKyc(user._id.toString(), {
      documentType: documentType as DocumentType,
      documentNumber,
      frontImage: frontImageUrl,
      backImage: backImageUrl,
      selfieImage: selfieImageUrl,
    });

    return successResponse(kyc, 'KYC submitted successfully', 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('already')) {
        return errorResponse(error.message, 400);
      }
    }
    return handleError(error);
  }
}
