import mongoose, { Schema, Model } from 'mongoose';

export interface IAppearanceSettings {
  _id: mongoose.Types.ObjectId;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logo?: string;
  favicon?: string;
  heroImage?: string;
  darkMode: boolean;
  customCss?: string;
  updatedAt: Date;
}

const AppearanceSettingsSchema = new Schema<IAppearanceSettings>(
  {
    primaryColor: {
      type: String,
      default: '#3B82F6',
    },
    secondaryColor: {
      type: String,
      default: '#1E40AF',
    },
    accentColor: {
      type: String,
      default: '#10B981',
    },
    logo: {
      type: String,
    },
    favicon: {
      type: String,
    },
    heroImage: {
      type: String,
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
    customCss: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Singleton pattern - only one appearance settings document
AppearanceSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export const AppearanceSettings: Model<IAppearanceSettings> =
  mongoose.models.AppearanceSettings ||
  mongoose.model<IAppearanceSettings>('AppearanceSettings', AppearanceSettingsSchema);

export default AppearanceSettings;
