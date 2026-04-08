import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { SettingsService } from '@/services/settingsService';
import { successResponse, unauthorizedResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const settings = await SettingsService.getAppearanceSettings();
    return successResponse(settings, 'Appearance settings retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const settings = await SettingsService.updateAppearanceSettings(body, admin._id.toString());

    return successResponse(settings, 'Appearance settings updated successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const settings = await SettingsService.resetAppearanceSettings(admin._id.toString());
    return successResponse(settings, 'Appearance settings reset to defaults');
  } catch (error) {
    return handleError(error);
  }
}
