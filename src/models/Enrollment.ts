import mongoose, { Schema, Model } from 'mongoose';
import { IEnrollment, EnrollmentStatus } from '@/types';

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    membership: {
      type: Schema.Types.ObjectId,
      ref: 'Membership',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(EnrollmentStatus),
      default: EnrollmentStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
EnrollmentSchema.index({ user: 1, membership: 1 });
EnrollmentSchema.index({ status: 1 });
EnrollmentSchema.index({ endDate: 1 });

// Static methods
EnrollmentSchema.statics.getActiveByUser = function (userId: mongoose.Types.ObjectId) {
  return this.find({
    user: userId,
    status: EnrollmentStatus.ACTIVE,
    endDate: { $gte: new Date() },
  }).populate('membership');
};

export const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);

export default Enrollment;
