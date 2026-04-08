import mongoose, { Schema, Model } from 'mongoose';
import { IAdmin, AdminRole, AdminStatus } from '@/types';

const AdminSchema = new Schema<IAdmin>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(AdminRole),
      default: AdminRole.ADMIN,
    },
    permissions: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(AdminStatus),
      default: AdminStatus.ACTIVE,
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search
AdminSchema.index({ name: 'text', email: 'text' });

// Instance method to check if admin has permission
AdminSchema.methods.hasPermission = function (permission: string): boolean {
  if (this.role === AdminRole.SUPER_ADMIN) {
    return true;
  }
  return this.permissions.includes(permission);
};

// Instance method to check if admin is active
AdminSchema.methods.isActive = function (): boolean {
  return this.status === AdminStatus.ACTIVE;
};

// Prevent model recompilation in development
const Admin: Model<IAdmin> =
  mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);

export default Admin;
