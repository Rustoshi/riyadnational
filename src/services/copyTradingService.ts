import { Types } from 'mongoose';
import { CopyTrader, CopyPosition, User, Transaction, Activity, Notification } from '@/models';
import {
  ICopyTrader,
  ICopyPosition,
  CopyTradingStatus,
  TransactionType,
  TransactionStatus,
  ActivityActorType,
  NotificationType,
} from '@/types';

export class CopyTradingService {
  /**
   * Get all active traders
   */
  static async getActiveTraders(): Promise<ICopyTrader[]> {
    return CopyTrader.find({ status: CopyTradingStatus.ACTIVE }).sort({ totalProfit: -1 });
  }

  /**
   * Get trader by ID
   */
  static async getTraderById(traderId: string): Promise<ICopyTrader | null> {
    return CopyTrader.findById(traderId);
  }

  /**
   * Start copying a trader
   */
  static async startCopying(
    userId: string,
    traderId: string,
    amount: number
  ): Promise<ICopyPosition> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const trader = await CopyTrader.findById(traderId);
    if (!trader || trader.status !== CopyTradingStatus.ACTIVE) {
      throw new Error('Trader not found or inactive');
    }

    if (amount < trader.minInvestment) {
      throw new Error(`Minimum investment is $${trader.minInvestment}`);
    }

    if (user.tradingBalance < amount) {
      throw new Error('Insufficient trading balance');
    }

    // Check existing position
    const existing = await CopyPosition.findOne({
      user: userId,
      trader: traderId,
      status: CopyTradingStatus.ACTIVE,
    });

    if (existing) {
      throw new Error('Already copying this trader');
    }

    // Deduct from trading balance
    user.tradingBalance -= amount;
    await user.save();

    // Create position
    const position = await CopyPosition.create({
      user: user._id,
      trader: trader._id,
      investedAmount: amount,
      currentValue: amount,
      profitLoss: 0,
      status: CopyTradingStatus.ACTIVE,
      startedAt: new Date(),
    });

    // Update trader copiers count
    trader.copiers += 1;
    await trader.save();

    // Create transaction
    await Transaction.create({
      user: user._id,
      type: TransactionType.INVESTMENT,
      amount,
      balanceBefore: user.tradingBalance + amount,
      balanceAfter: user.tradingBalance,
      status: TransactionStatus.COMPLETED,
      description: `Copy trading investment: ${trader.name}`,
      metadata: { traderId: trader._id, positionId: position._id },
    });

    // Notification
    await Notification.create({
      user: user._id,
      title: 'Copy Trading Started',
      message: `You are now copying ${trader.name} with $${amount.toFixed(2)}.`,
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'start_copy_trading',
      resource: 'copy_position',
      resourceId: position._id,
      details: { traderId, amount },
    });

    return position;
  }

  /**
   * Stop copying a trader
   */
  static async stopCopying(userId: string, positionId: string): Promise<ICopyPosition> {
    const position = await CopyPosition.findOne({
      _id: positionId,
      user: userId,
      status: CopyTradingStatus.ACTIVE,
    });

    if (!position) {
      throw new Error('Position not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const trader = await CopyTrader.findById(position.trader);

    // Calculate profit share if profitable
    let payout = position.currentValue;
    if (position.profitLoss > 0 && trader) {
      const profitShare = position.profitLoss * (trader.profitShare / 100);
      payout = position.currentValue - profitShare;
    }

    // Return funds to trading balance
    user.tradingBalance += payout;
    await user.save();

    // Update position
    position.status = CopyTradingStatus.STOPPED;
    position.stoppedAt = new Date();
    await position.save();

    // Update trader copiers count
    if (trader) {
      trader.copiers = Math.max(0, trader.copiers - 1);
      await trader.save();
    }

    // Create transaction
    await Transaction.create({
      user: user._id,
      type: TransactionType.INVESTMENT,
      amount: payout,
      balanceBefore: user.tradingBalance - payout,
      balanceAfter: user.tradingBalance,
      status: TransactionStatus.COMPLETED,
      description: `Copy trading closed: ${trader?.name || 'Unknown'}`,
      metadata: { positionId: position._id, profitLoss: position.profitLoss },
    });

    // Notification
    await Notification.create({
      user: user._id,
      title: 'Copy Trading Stopped',
      message: `Your copy trading position has been closed. Final value: $${payout.toFixed(2)}`,
      type: NotificationType.INFO,
    });

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'stop_copy_trading',
      resource: 'copy_position',
      resourceId: position._id,
      details: { payout, profitLoss: position.profitLoss },
    });

    return position;
  }

  /**
   * Get user's positions
   */
  static async getUserPositions(
    userId: string,
    options: { activeOnly?: boolean } = {}
  ): Promise<ICopyPosition[]> {
    const query: Record<string, unknown> = { user: new Types.ObjectId(userId) };
    if (options.activeOnly) {
      query.status = CopyTradingStatus.ACTIVE;
    }
    return CopyPosition.find(query).populate('trader').sort({ createdAt: -1 });
  }

  /**
   * Admin: Create trader
   */
  static async createTrader(
    data: {
      name: string;
      description?: string;
      avatar?: string;
      minInvestment: number;
      profitShare: number;
    },
    adminId: string
  ): Promise<ICopyTrader> {
    const trader = await CopyTrader.create({
      ...data,
      status: CopyTradingStatus.ACTIVE,
    });

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'create_copy_trader',
      resource: 'copy_trader',
      resourceId: trader._id,
      details: data,
    });

    return trader;
  }

  /**
   * Admin: Update trader stats
   */
  static async updateTraderStats(
    traderId: string,
    stats: {
      totalProfit?: number;
      winRate?: number;
      totalTrades?: number;
    },
    adminId: string
  ): Promise<ICopyTrader> {
    const trader = await CopyTrader.findById(traderId);
    if (!trader) {
      throw new Error('Trader not found');
    }

    Object.assign(trader, stats);
    await trader.save();

    // Update all active positions
    if (stats.totalProfit !== undefined) {
      const positions = await CopyPosition.find({
        trader: traderId,
        status: CopyTradingStatus.ACTIVE,
      });

      for (const position of positions) {
        const profitRatio = stats.totalProfit / 100;
        position.profitLoss = position.investedAmount * profitRatio;
        position.currentValue = position.investedAmount + position.profitLoss;
        await position.save();
      }
    }

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_copy_trader',
      resource: 'copy_trader',
      resourceId: trader._id,
      details: stats,
    });

    return trader;
  }
}

export default CopyTradingService;
