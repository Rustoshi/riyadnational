import { Types } from 'mongoose';
import { Settings, Activity, AppearanceSettings } from '@/models';
import { SettingsCategory, ActivityActorType } from '@/types';

export class SettingsService {
  /**
   * Get all settings
   */
  static async getAllSettings(): Promise<Record<string, unknown>> {
    const settings = await Settings.find();
    const result: Record<string, unknown> = {};
    
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    
    return result;
  }

  /**
   * Get settings by category
   */
  static async getByCategory(category: SettingsCategory): Promise<Record<string, unknown>> {
    const settings = await Settings.find({ category });
    const result: Record<string, unknown> = {};
    
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    
    return result;
  }

  /**
   * Get single setting
   */
  static async get(key: string): Promise<unknown> {
    const setting = await Settings.findOne({ key });
    return setting?.value;
  }

  /**
   * Set single setting
   */
  static async set(
    key: string,
    value: unknown,
    category: SettingsCategory,
    adminId: string
  ): Promise<void> {
    await Settings.findOneAndUpdate(
      { key },
      { key, value, category },
      { upsert: true }
    );

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_setting',
      resource: 'settings',
      details: { key, category },
    });
  }

  /**
   * Update multiple settings
   */
  static async updateMany(
    settings: Array<{ key: string; value: unknown; category: SettingsCategory }>,
    adminId: string
  ): Promise<void> {
    for (const setting of settings) {
      await Settings.findOneAndUpdate(
        { key: setting.key },
        setting,
        { upsert: true }
      );
    }

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_settings',
      resource: 'settings',
      details: { count: settings.length },
    });
  }

  /**
   * Delete setting
   */
  static async delete(key: string, adminId: string): Promise<void> {
    await Settings.deleteOne({ key });

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'delete_setting',
      resource: 'settings',
      details: { key },
    });
  }

  // ==================== APP SETTINGS ====================

  /**
   * Get app settings
   */
  static async getAppSettings(): Promise<Record<string, unknown>> {
    return this.getByCategory(SettingsCategory.GENERAL);
  }

  /**
   * Update app info
   */
  static async updateAppInfo(
    data: {
      siteName?: string;
      siteEmail?: string;
      sitePhone?: string;
      siteAddress?: string;
      currency?: string;
      currencySymbol?: string;
      timezone?: string;
      maintenanceMode?: boolean;
    },
    adminId: string
  ): Promise<void> {
    const settings = Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => ({
        key: `app_${key}`,
        value,
        category: SettingsCategory.GENERAL,
      }));

    await this.updateMany(settings, adminId);
  }

  // ==================== REFERRAL SETTINGS ====================

  /**
   * Get referral settings
   */
  static async getReferralSettings(): Promise<Record<string, unknown>> {
    const settings = await Settings.find({ key: { $regex: /^referral_/ } });
    const result: Record<string, unknown> = {};
    
    for (const setting of settings) {
      result[setting.key.replace('referral_', '')] = setting.value;
    }
    
    return result;
  }

  /**
   * Update referral bonus
   */
  static async updateReferralBonus(
    data: {
      enabled?: boolean;
      referrerBonus?: number;
      refereeBonus?: number;
      minDeposit?: number;
    },
    adminId: string
  ): Promise<void> {
    const settings = Object.entries(data).map(([key, value]) => ({
      key: `referral_${key}`,
      value,
      category: SettingsCategory.GENERAL,
    }));

    await this.updateMany(settings, adminId);
  }

  // ==================== LIMITS SETTINGS ====================

  /**
   * Get limits settings
   */
  static async getLimitsSettings(): Promise<Record<string, unknown>> {
    return this.getByCategory(SettingsCategory.LIMITS);
  }

  /**
   * Update limits
   */
  static async updateLimits(
    data: {
      minDeposit?: number;
      maxDeposit?: number;
      minWithdrawal?: number;
      maxWithdrawal?: number;
      dailyWithdrawalLimit?: number;
      minTransfer?: number;
      maxTransfer?: number;
      dailyTransferLimit?: number;
    },
    adminId: string
  ): Promise<void> {
    const settings = Object.entries(data).map(([key, value]) => ({
      key: `limit_${key}`,
      value,
      category: SettingsCategory.LIMITS,
    }));

    await this.updateMany(settings, adminId);
  }

  // ==================== SECURITY SETTINGS ====================

  /**
   * Get security settings
   */
  static async getSecuritySettings(): Promise<Record<string, unknown>> {
    return this.getByCategory(SettingsCategory.SECURITY);
  }

  /**
   * Update security settings
   */
  static async updateSecuritySettings(
    data: {
      requireEmailVerification?: boolean;
      requireKyc?: boolean;
      require2FA?: boolean;
      requirePin?: boolean;
      maxLoginAttempts?: number;
      lockoutDuration?: number;
    },
    adminId: string
  ): Promise<void> {
    const settings = Object.entries(data).map(([key, value]) => ({
      key: `security_${key}`,
      value,
      category: SettingsCategory.SECURITY,
    }));

    await this.updateMany(settings, adminId);
  }

  // ==================== EMAIL SETTINGS ====================

  /**
   * Get email settings
   */
  static async getEmailSettings(): Promise<Record<string, unknown>> {
    return this.getByCategory(SettingsCategory.EMAIL);
  }

  /**
   * Update email settings
   */
  static async updateEmailSettings(
    data: {
      smtpHost?: string;
      smtpPort?: number;
      smtpUser?: string;
      smtpPassword?: string;
      fromEmail?: string;
      fromName?: string;
    },
    adminId: string
  ): Promise<void> {
    const settings = Object.entries(data).map(([key, value]) => ({
      key: `email_${key}`,
      value,
      category: SettingsCategory.EMAIL,
    }));

    await this.updateMany(settings, adminId);
  }

  // ==================== APPEARANCE SETTINGS ====================

  /**
   * Get appearance settings
   */
  static async getAppearanceSettings(): Promise<unknown> {
    let settings = await AppearanceSettings.findOne();
    if (!settings) {
      settings = await AppearanceSettings.create({});
    }
    return settings;
  }

  /**
   * Update appearance settings
   */
  static async updateAppearanceSettings(
    data: Partial<{
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
      logo: string;
      favicon: string;
      heroImage: string;
      darkMode: boolean;
      customCss: string;
    }>,
    adminId: string
  ): Promise<unknown> {
    let settings = await AppearanceSettings.findOne();
    if (!settings) {
      settings = await AppearanceSettings.create(data);
    } else {
      Object.assign(settings, data);
      await settings.save();
    }

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_appearance',
      resource: 'appearance_settings',
      details: { keys: Object.keys(data) },
    });

    return settings;
  }

  /**
   * Reset appearance settings
   */
  static async resetAppearanceSettings(adminId: string): Promise<unknown> {
    await AppearanceSettings.deleteMany({});
    const settings = await AppearanceSettings.create({});

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'reset_appearance',
      resource: 'appearance_settings',
    });

    return settings;
  }
}

export default SettingsService;
