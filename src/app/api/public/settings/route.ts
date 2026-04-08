import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { SettingsService } from '@/services/settingsService';

/**
 * GET /api/public/settings
 * Get public site settings (no auth required)
 */
export async function GET() {
  try {
    await connectDB();

    const settings = await SettingsService.getAppSettings();

    // Return only public-safe settings
    return NextResponse.json({
      success: true,
      data: {
        siteName: settings.app_siteName || '',
        siteEmail: settings.app_siteEmail || '',
        sitePhone: settings.app_sitePhone || '',
        siteAddress: settings.app_siteAddress || '',
        currency: settings.app_currency || 'USD',
        currencySymbol: settings.app_currencySymbol || '$',
      },
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
