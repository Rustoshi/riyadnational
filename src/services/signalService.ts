import { Types } from 'mongoose';
import { SignalProvider, Signal, SignalSubscription, User, Transaction, Activity, Notification } from '@/models';
import {
  ISignalProvider,
  ISignal,
  ISignalSubscription,
  SignalProviderStatus,
  SignalStatus,
  TransactionType,
  TransactionStatus,
  ActivityActorType,
  NotificationType,
} from '@/types';

export class SignalService {
  /**
   * Get all active signal providers
   */
  static async getActiveProviders(): Promise<ISignalProvider[]> {
    return SignalProvider.find({ status: SignalProviderStatus.ACTIVE }).sort({ winRate: -1 });
  }

  /**
   * Get provider by ID
   */
  static async getProviderById(providerId: string): Promise<ISignalProvider | null> {
    return SignalProvider.findById(providerId);
  }

  /**
   * Get provider's signals
   */
  static async getProviderSignals(
    providerId: string,
    options: { status?: SignalStatus; page?: number; limit?: number } = {}
  ): Promise<{ signals: ISignal[]; total: number }> {
    const { status, page = 1, limit = 10 } = options;
    const query: Record<string, unknown> = { provider: new Types.ObjectId(providerId) };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [signals, total] = await Promise.all([
      Signal.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Signal.countDocuments(query),
    ]);

    return { signals, total };
  }

  /**
   * Subscribe to provider
   */
  static async subscribe(
    userId: string,
    providerId: string,
    durationDays: number = 30
  ): Promise<ISignalSubscription> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const provider = await SignalProvider.findById(providerId);
    if (!provider || provider.status !== SignalProviderStatus.ACTIVE) {
      throw new Error('Provider not found or inactive');
    }

    // Check existing subscription
    const existing = await SignalSubscription.findOne({
      user: userId,
      provider: providerId,
      status: 'active',
      endDate: { $gte: new Date() },
    });

    if (existing) {
      throw new Error('Already subscribed to this provider');
    }

    const fee = provider.subscriptionFee * (durationDays / 30);
    if (user.balance < fee) {
      throw new Error('Insufficient balance');
    }

    // Deduct balance
    const balanceBefore = user.balance;
    user.balance -= fee;
    await user.save();

    // Create subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    const subscription = await SignalSubscription.create({
      user: user._id,
      provider: provider._id,
      startDate,
      endDate,
      status: 'active',
    });

    // Update provider followers
    provider.followers += 1;
    await provider.save();

    // Create transaction
    await Transaction.create({
      user: user._id,
      type: TransactionType.FEE,
      amount: fee,
      balanceBefore,
      balanceAfter: user.balance,
      status: TransactionStatus.COMPLETED,
      description: `Signal subscription: ${provider.name}`,
      metadata: { providerId: provider._id, subscriptionId: subscription._id },
    });

    // Notification
    await Notification.create({
      user: user._id,
      title: 'Signal Subscription Active',
      message: `You are now subscribed to ${provider.name}'s signals until ${endDate.toLocaleDateString()}.`,
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'subscribe_signals',
      resource: 'signal_subscription',
      resourceId: subscription._id,
      details: { providerId, fee, durationDays },
    });

    return subscription;
  }

  /**
   * Get user's subscriptions
   */
  static async getUserSubscriptions(
    userId: string,
    options: { activeOnly?: boolean } = {}
  ): Promise<ISignalSubscription[]> {
    const query: Record<string, unknown> = { user: new Types.ObjectId(userId) };
    if (options.activeOnly) {
      query.status = 'active';
      query.endDate = { $gte: new Date() };
    }
    return SignalSubscription.find(query).populate('provider').sort({ createdAt: -1 });
  }

  /**
   * Check if user is subscribed to provider
   */
  static async isSubscribed(userId: string, providerId: string): Promise<boolean> {
    const subscription = await SignalSubscription.findOne({
      user: new Types.ObjectId(userId),
      provider: new Types.ObjectId(providerId),
      status: 'active',
      endDate: { $gte: new Date() },
    });
    return !!subscription;
  }

  /**
   * Admin: Create provider
   */
  static async createProvider(
    data: {
      name: string;
      description?: string;
      avatar?: string;
      subscriptionFee: number;
    },
    adminId: string
  ): Promise<ISignalProvider> {
    const provider = await SignalProvider.create({
      ...data,
      status: SignalProviderStatus.ACTIVE,
    });

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'create_signal_provider',
      resource: 'signal_provider',
      resourceId: provider._id,
      details: data,
    });

    return provider;
  }

  /**
   * Admin: Create signal
   */
  static async createSignal(
    providerId: string,
    data: {
      asset: string;
      action: 'buy' | 'sell';
      entryPrice: number;
      takeProfit: number;
      stopLoss: number;
    },
    adminId: string
  ): Promise<ISignal> {
    const provider = await SignalProvider.findById(providerId);
    if (!provider) {
      throw new Error('Provider not found');
    }

    const signal = await Signal.create({
      provider: provider._id,
      ...data,
      status: SignalStatus.ACTIVE,
    });

    // Update provider stats
    provider.totalSignals += 1;
    await provider.save();

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'create_signal',
      resource: 'signal',
      resourceId: signal._id,
      details: { providerId, ...data },
    });

    return signal;
  }

  /**
   * Admin: Close signal
   */
  static async closeSignal(
    signalId: string,
    result: 'win' | 'loss',
    profitLoss: number,
    adminId: string
  ): Promise<ISignal> {
    const signal = await Signal.findById(signalId);
    if (!signal) {
      throw new Error('Signal not found');
    }

    signal.status = SignalStatus.CLOSED;
    signal.result = result;
    signal.profitLoss = profitLoss;
    signal.closedAt = new Date();
    await signal.save();

    // Update provider stats
    const provider = await SignalProvider.findById(signal.provider);
    if (provider) {
      const allSignals = await Signal.find({ provider: provider._id, status: SignalStatus.CLOSED });
      const wins = allSignals.filter(s => s.result === 'win').length;
      provider.winRate = (wins / allSignals.length) * 100;
      provider.profitPercentage = allSignals.reduce((sum, s) => sum + (s.profitLoss || 0), 0);
      await provider.save();
    }

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'close_signal',
      resource: 'signal',
      resourceId: signal._id,
      details: { result, profitLoss },
    });

    return signal;
  }
}

export default SignalService;
