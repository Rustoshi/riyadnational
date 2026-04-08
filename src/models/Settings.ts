import mongoose, { Schema, Model } from 'mongoose';
import { ISettings, SettingsCategory } from '@/types';

const SettingsSchema = new Schema<ISettings>(
  {
    key: {
      type: String,
      required: [true, 'Key is required'],
      unique: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: [true, 'Value is required'],
    },
    category: {
      type: String,
      enum: Object.values(SettingsCategory),
      default: SettingsCategory.GENERAL,
    },
  },
  {
    timestamps: true,
  }
);

// Index for queries
SettingsSchema.index({ category: 1 });

// Static method to get setting by key
SettingsSchema.statics.getSetting = async function (key: string) {
  const setting = await this.findOne({ key });
  return setting?.value;
};

// Static method to set setting
SettingsSchema.statics.setSetting = async function (
  key: string,
  value: unknown,
  category: SettingsCategory = SettingsCategory.GENERAL
) {
  return this.findOneAndUpdate(
    { key },
    { key, value, category },
    { upsert: true, new: true }
  );
};

// Static method to get settings by category
SettingsSchema.statics.getByCategory = function (category: SettingsCategory) {
  return this.find({ category });
};

// Static method to get all settings as object
SettingsSchema.statics.getAllAsObject = async function () {
  const settings = await this.find({});
  const result: Record<string, unknown> = {};
  settings.forEach((setting: ISettings) => {
    result[setting.key] = setting.value;
  });
  return result;
};

// Static method to bulk update settings
SettingsSchema.statics.bulkUpdate = async function (
  updates: Array<{ key: string; value: unknown; category?: SettingsCategory }>
) {
  const operations = updates.map((update) => ({
    updateOne: {
      filter: { key: update.key },
      update: {
        $set: {
          value: update.value,
          category: update.category || SettingsCategory.GENERAL,
        },
      },
      upsert: true,
    },
  }));
  return this.bulkWrite(operations);
};

// Prevent model recompilation in development
const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
