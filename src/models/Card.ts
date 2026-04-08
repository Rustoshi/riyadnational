import mongoose, { Schema, Model } from 'mongoose';
import { ICard, CardType, CardStatus, IBillingAddress } from '@/types';
import { generateCardNumber, generateCVV, generateCardExpiry } from '@/lib/utils';

const BillingAddressSchema = new Schema<IBillingAddress>(
  {
    street: {
      type: String,
      required: [true, 'Street is required'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
    },
    state: {
      type: String,
      required: [true, 'State is required'],
    },
    zipCode: {
      type: String,
      required: [true, 'Zip code is required'],
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
    },
  },
  { _id: false }
);

const CardSchema = new Schema<ICard>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    cardNumber: {
      type: String,
      unique: true,
    },
    cardNumberLast4: {
      type: String,
    },
    expiryMonth: {
      type: String,
    },
    expiryYear: {
      type: String,
    },
    cvv: {
      type: String,
    },
    cardholderName: {
      type: String,
      required: [true, 'Cardholder name is required'],
    },
    cardType: {
      type: String,
      enum: Object.values(CardType),
      required: [true, 'Card type is required'],
    },
    cardDesign: {
      type: String,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    status: {
      type: String,
      enum: Object.values(CardStatus),
      default: CardStatus.PENDING,
    },
    pin: {
      type: String,
    },
    dailyLimit: {
      type: Number,
      default: 5000,
    },
    monthlyLimit: {
      type: Number,
      default: 50000,
    },
    billingAddress: {
      type: BillingAddressSchema,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to generate card details
CardSchema.pre('save', async function () {
  if (this.isNew) {
    if (!this.cardNumber) {
      let cardNumber = generateCardNumber(this.cardType);
      const CardModel = mongoose.model<ICard>('Card');
      let exists = await CardModel.findOne({ cardNumber });
      while (exists) {
        cardNumber = generateCardNumber(this.cardType);
        exists = await CardModel.findOne({ cardNumber });
      }
      this.cardNumber = cardNumber;
      this.cardNumberLast4 = cardNumber.slice(-4);
    }

    if (!this.cvv) {
      this.cvv = generateCVV();
    }

    if (!this.expiryMonth || !this.expiryYear) {
      const expiry = generateCardExpiry();
      this.expiryMonth = expiry.month;
      this.expiryYear = expiry.year;
    }
  }
});

// Index for queries
CardSchema.index({ status: 1 });
CardSchema.index({ user: 1, status: 1 });

// Static method to get pending cards
CardSchema.statics.getPending = function () {
  return this.find({ status: CardStatus.PENDING })
    .populate('user', 'name email accountNumber')
    .sort({ createdAt: -1 });
};

// Static method to get user cards
CardSchema.statics.getUserCards = function (
  userId: mongoose.Types.ObjectId,
  options: { status?: CardStatus } = {}
) {
  const query: Record<string, unknown> = { user: userId };
  if (options.status) {
    query.status = options.status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

// Instance method to check if card can be used
CardSchema.methods.canUse = function (amount: number): boolean {
  return (
    this.status === CardStatus.ACTIVE &&
    this.balance >= amount
  );
};

// Virtual for masked card number
CardSchema.virtual('maskedNumber').get(function () {
  return `****-****-****-${this.cardNumberLast4}`;
});

// Virtual for expiry date
CardSchema.virtual('expiryDate').get(function () {
  return `${this.expiryMonth}/${this.expiryYear}`;
});

// Ensure virtuals are included in JSON
CardSchema.set('toJSON', { virtuals: true });
CardSchema.set('toObject', { virtuals: true });

// Prevent model recompilation in development
const Card: Model<ICard> =
  mongoose.models.Card || mongoose.model<ICard>('Card', CardSchema);

export default Card;
