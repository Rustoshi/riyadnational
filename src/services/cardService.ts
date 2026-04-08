import { Types } from 'mongoose';
import { Card, CardTransaction, User, Activity, Notification } from '@/models';
import { hashPassword, comparePassword } from '@/lib/utils';
import {
  ICard,
  ICardTransaction,
  CardType,
  CardStatus,
  TransactionStatus,
  ActivityActorType,
  NotificationType,
  IBillingAddress,
} from '@/types';

export class CardService {
  /**
   * Get user cards
   */
  static async getUserCards(
    userId: string,
    options: { status?: CardStatus } = {}
  ): Promise<ICard[]> {
    const query: Record<string, unknown> = { user: new Types.ObjectId(userId) };
    if (options.status) {
      query.status = options.status;
    }
    return Card.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get card by ID
   */
  static async getCardById(cardId: string): Promise<ICard | null> {
    return Card.findById(cardId);
  }

  /**
   * Apply for a new card
   */
  static async applyCard(
    userId: string,
    cardType: CardType,
    cardholderName: string,
    billingAddress: IBillingAddress
  ): Promise<ICard> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const card = await Card.create({
      user: user._id,
      cardType,
      cardholderName,
      billingAddress,
      status: CardStatus.PENDING,
    });

    // Create notification
    await Notification.create({
      user: user._id,
      title: 'Card Application Submitted',
      message: `Your ${cardType} card application has been submitted and is pending approval.`,
      type: NotificationType.INFO,
    });

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'apply_card',
      resource: 'card',
      resourceId: card._id,
      details: { cardType },
    });

    return card;
  }

  /**
   * Set card PIN
   */
  static async setCardPin(cardId: string, userId: string, pin: string): Promise<void> {
    const card = await Card.findOne({ _id: cardId, user: userId });
    if (!card) {
      throw new Error('Card not found');
    }

    card.pin = await hashPassword(pin);
    await card.save();
  }

  /**
   * Verify card PIN
   */
  static async verifyCardPin(cardId: string, pin: string): Promise<boolean> {
    const card = await Card.findById(cardId);
    if (!card || !card.pin) {
      return false;
    }
    return comparePassword(pin, card.pin);
  }

  /**
   * Activate card
   */
  static async activateCard(cardId: string, userId: string): Promise<ICard> {
    const card = await Card.findOne({ _id: cardId, user: userId });
    if (!card) {
      throw new Error('Card not found');
    }

    if (card.status !== CardStatus.ACTIVE && card.status !== CardStatus.PENDING) {
      throw new Error('Card cannot be activated');
    }

    card.status = CardStatus.ACTIVE;
    await card.save();

    return card;
  }

  /**
   * Block card
   */
  static async blockCard(cardId: string, userId: string): Promise<ICard> {
    const card = await Card.findOne({ _id: cardId, user: userId });
    if (!card) {
      throw new Error('Card not found');
    }

    card.status = CardStatus.BLOCKED;
    await card.save();

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(userId),
      actorType: ActivityActorType.USER,
      action: 'block_card',
      resource: 'card',
      resourceId: card._id,
    });

    return card;
  }

  /**
   * Get card transactions
   */
  static async getCardTransactions(
    cardId: string,
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ transactions: ICardTransaction[]; total: number }> {
    const { page = 1, limit = 10 } = options;
    const card = await Card.findOne({ _id: cardId, user: userId });
    if (!card) {
      throw new Error('Card not found');
    }

    const skip = (page - 1) * limit;
    const query = { card: card._id };

    const [transactions, total] = await Promise.all([
      CardTransaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      CardTransaction.countDocuments(query),
    ]);

    return { transactions, total };
  }

  /**
   * Admin: Get all cards
   */
  static async getAllCards(
    options: { page?: number; limit?: number; status?: CardStatus } = {}
  ): Promise<{ cards: ICard[]; total: number }> {
    const { page = 1, limit = 10, status } = options;
    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [cards, total] = await Promise.all([
      Card.find(query)
        .populate('user', 'name email accountNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Card.countDocuments(query),
    ]);

    return { cards, total };
  }

  /**
   * Admin: Approve card
   */
  static async approveCard(cardId: string, adminId: string): Promise<ICard> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    if (card.status !== CardStatus.PENDING) {
      throw new Error('Card is not pending approval');
    }

    card.status = CardStatus.ACTIVE;
    card.approvedBy = new Types.ObjectId(adminId);
    card.approvedAt = new Date();
    await card.save();

    // Notify user
    await Notification.create({
      user: card.user,
      title: 'Card Approved',
      message: `Your ${card.cardType} card has been approved and is now active.`,
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'approve_card',
      resource: 'card',
      resourceId: card._id,
    });

    return card;
  }

  /**
   * Admin: Reject card
   */
  static async rejectCard(cardId: string, adminId: string, reason?: string): Promise<ICard> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    await Card.findByIdAndDelete(cardId);

    // Notify user
    await Notification.create({
      user: card.user,
      title: 'Card Application Rejected',
      message: `Your ${card.cardType} card application has been rejected. ${reason || ''}`,
      type: NotificationType.ERROR,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'reject_card',
      resource: 'card',
      details: { reason },
    });

    return card;
  }

  /**
   * Admin: Topup card
   */
  static async topupCard(cardId: string, amount: number, adminId: string): Promise<ICard> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    const balanceBefore = card.balance;
    card.balance += amount;
    await card.save();

    // Create card transaction
    await CardTransaction.create({
      card: card._id,
      user: card.user,
      type: 'topup',
      amount,
      balanceBefore,
      balanceAfter: card.balance,
      description: 'Admin topup',
      status: TransactionStatus.COMPLETED,
    });

    // Notify user
    await Notification.create({
      user: card.user,
      title: 'Card Topped Up',
      message: `Your card ending in ${card.cardNumberLast4} has been topped up with $${amount.toFixed(2)}.`,
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'topup_card',
      resource: 'card',
      resourceId: card._id,
      details: { amount },
    });

    return card;
  }

  /**
   * Admin: Deduct from card
   */
  static async deductCard(
    cardId: string,
    amount: number,
    adminId: string,
    description?: string
  ): Promise<ICard> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    if (card.balance < amount) {
      throw new Error('Insufficient card balance');
    }

    const balanceBefore = card.balance;
    card.balance -= amount;
    await card.save();

    // Create card transaction
    await CardTransaction.create({
      card: card._id,
      user: card.user,
      type: 'withdrawal',
      amount,
      balanceBefore,
      balanceAfter: card.balance,
      description: description || 'Admin deduction',
      status: TransactionStatus.COMPLETED,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'deduct_card',
      resource: 'card',
      resourceId: card._id,
      details: { amount, description },
    });

    return card;
  }

  /**
   * Admin: Block card
   */
  static async adminBlockCard(cardId: string, adminId: string): Promise<ICard> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    card.status = CardStatus.BLOCKED;
    await card.save();

    // Notify user
    await Notification.create({
      user: card.user,
      title: 'Card Blocked',
      message: `Your card ending in ${card.cardNumberLast4} has been blocked.`,
      type: NotificationType.WARNING,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'block_card',
      resource: 'card',
      resourceId: card._id,
    });

    return card;
  }

  /**
   * Admin: Unblock card
   */
  static async adminUnblockCard(cardId: string, adminId: string): Promise<ICard> {
    const card = await Card.findById(cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    card.status = CardStatus.ACTIVE;
    await card.save();

    // Notify user
    await Notification.create({
      user: card.user,
      title: 'Card Unblocked',
      message: `Your card ending in ${card.cardNumberLast4} has been unblocked.`,
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'unblock_card',
      resource: 'card',
      resourceId: card._id,
    });

    return card;
  }
}

export default CardService;
