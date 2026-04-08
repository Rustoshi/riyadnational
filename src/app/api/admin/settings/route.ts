import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { SettingsService } from '@/services/settingsService';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { SettingsCategory } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as SettingsCategory | undefined;
    const type = searchParams.get('type');

    if (type === 'appearance') {
      const settings = await SettingsService.getAppearanceSettings();
      return successResponse(settings, 'Appearance settings retrieved successfully');
    }

    if (type === 'referral') {
      const settings = await SettingsService.getReferralSettings();
      return successResponse(settings, 'Referral settings retrieved successfully');
    }

    if (type === 'limits') {
      const settings = await SettingsService.getLimitsSettings();
      return successResponse(settings, 'Limits settings retrieved successfully');
    }

    if (type === 'security') {
      const settings = await SettingsService.getSecuritySettings();
      return successResponse(settings, 'Security settings retrieved successfully');
    }

    if (type === 'email') {
      const settings = await SettingsService.getEmailSettings();
      return successResponse(settings, 'Email settings retrieved successfully');
    }

    if (category) {
      const settings = await SettingsService.getByCategory(category);
      return successResponse(settings, 'Settings retrieved successfully');
    }

    const settings = await SettingsService.getAllSettings();
    return successResponse(settings, 'All settings retrieved successfully');
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
    const { type, ...data } = body;

    switch (type) {
      case 'app':
        await SettingsService.updateAppInfo(data, admin._id.toString());
        break;
      case 'referral':
        await SettingsService.updateReferralBonus(data, admin._id.toString());
        break;
      case 'limits':
        await SettingsService.updateLimits(data, admin._id.toString());
        break;
      case 'security':
        await SettingsService.updateSecuritySettings(data, admin._id.toString());
        break;
      case 'email':
        await SettingsService.updateEmailSettings(data, admin._id.toString());
        break;
      case 'single':
        if (!data.key || data.value === undefined || !data.category) {
          return errorResponse('Key, value, and category are required', 400);
        }
        await SettingsService.set(data.key, data.value, data.category, admin._id.toString());
        break;
      default:
        return errorResponse('Invalid settings type', 400);
    }

    return successResponse(null, 'Settings updated successfully');
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

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return errorResponse('Key is required', 400);
    }

    await SettingsService.delete(key, admin._id.toString());
    return successResponse(null, 'Setting deleted successfully');
  } catch (error) {
    return handleError(error);
  }
}
