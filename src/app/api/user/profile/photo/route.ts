import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { UserService } from '@/services/userService';
import { successResponse, errorResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';
import { uploadBase64ToCloudinary } from '@/lib/cloudinary';
import { sanitizeUser } from '@/lib/utils';

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { photo } = body;

    if (!photo) {
      return errorResponse('Photo is required', 400);
    }

    // Upload to Cloudinary
    let photoUrl = photo;
    if (photo.startsWith('data:')) {
      const result = await uploadBase64ToCloudinary(photo, {
        folder: 'profile-photos',
        publicId: `user-${user._id}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto' },
        ],
      });
      photoUrl = result.secure_url;
    }

    const updatedUser = await UserService.updateProfilePhoto(user._id.toString(), photoUrl);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return successResponse(sanitizeUser((updatedUser as any).toObject()), 'Profile photo updated successfully');
  } catch (error) {
    return handleError(error);
  }
}
