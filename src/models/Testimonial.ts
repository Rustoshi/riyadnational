import mongoose, { Schema, Model } from 'mongoose';

export interface ITestimonial {
  _id: mongoose.Types.ObjectId;
  name: string;
  role?: string;
  content: string;
  avatar?: string;
  rating: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    role: {
      type: String,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    avatar: {
      type: String,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

TestimonialSchema.index({ isActive: 1 });

export const Testimonial: Model<ITestimonial> =
  mongoose.models.Testimonial || mongoose.model<ITestimonial>('Testimonial', TestimonialSchema);

export default Testimonial;
