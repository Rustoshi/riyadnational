import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { successResponse, unauthorizedResponse, notFoundResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { User } from '@/models';
import { uploadToCloudinary, deleteFromCloudinary, extractPublicIdFromUrl, isCloudinaryConfigured } from '@/lib/cloudinary';

// POST /api/admin/users/[id]/profile-photo - Change user profile photo
export async function POST(
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
    
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return errorResponse('No photo file provided', 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('Invalid file type. Only JPEG, JPG, PNG, and WebP are allowed', 400);
    }

    // Validate file size (max 4MB)
    const maxSize = 4 * 1024 * 1024; // 4MB
    if (file.size > maxSize) {
      return errorResponse('File size exceeds 4MB limit', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return notFoundResponse('User not found');
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      return errorResponse('Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your environment variables.', 500);
    }

    // Delete old profile photo from Cloudinary if exists
    if (user.profilePhoto) {
      const oldPublicId = extractPublicIdFromUrl(user.profilePhoto);
      if (oldPublicId) {
        try {
          await deleteFromCloudinary(oldPublicId);
        } catch (deleteError) {
          // Log but don't fail if old image deletion fails
          console.error('Failed to delete old profile photo:', deleteError);
        }
      }
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary with transformations for profile photos
    const result = await uploadToCloudinary(buffer, {
      folder: 'banking-app/profile-photos',
      publicId: `user_${id}_${Date.now()}`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    // Update user profile photo URL
    user.profilePhoto = result.secure_url;
    await user.save();

    return successResponse(
      { 
        profilePhoto: user.profilePhoto,
        publicId: result.public_id,
      },
      'Profile photo updated successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}
