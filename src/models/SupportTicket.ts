import mongoose, { Schema, Document, Model } from 'mongoose';

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export interface ISupportTicket extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  ticketNumber: string;
  subject: string;
  message: string;
  priority: TicketPriority;
  status: TicketStatus;
  adminResponse?: string;
  respondedBy?: mongoose.Types.ObjectId;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ISupportTicketModel extends Model<ISupportTicket> {
  generateTicketNumber(): Promise<string>;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ticketNumber: {
      type: String,
      unique: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    priority: {
      type: String,
      enum: Object.values(TicketPriority),
      default: TicketPriority.MEDIUM,
    },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.OPEN,
    },
    adminResponse: {
      type: String,
      trim: true,
    },
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    respondedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate ticket number before saving
SupportTicketSchema.pre('save', async function () {
  if (this.isNew && !this.ticketNumber) {
    const SupportTicketModel = mongoose.model<ISupportTicket>('SupportTicket');
    const count = await SupportTicketModel.countDocuments();
    const timestamp = Date.now().toString().slice(-6);
    this.ticketNumber = `TKT-${timestamp}-${(count + 1).toString().padStart(4, '0')}`;
  }
});

// Static method to generate ticket number
SupportTicketSchema.statics.generateTicketNumber = async function (): Promise<string> {
  const count = await this.countDocuments();
  const timestamp = Date.now().toString().slice(-6);
  return `TKT-${timestamp}-${(count + 1).toString().padStart(4, '0')}`;
};

const SupportTicket =
  (mongoose.models.SupportTicket as ISupportTicketModel) ||
  mongoose.model<ISupportTicket, ISupportTicketModel>('SupportTicket', SupportTicketSchema);

export default SupportTicket;
