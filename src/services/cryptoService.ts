import { Types } from 'mongoose';
import { CryptoAsset, CryptoTransaction, CryptoWallet, User, Activity, Notification } from '@/models';
import { generateReference } from '@/lib/utils';
import {
  ICryptoAsset,
  ICryptoTransaction,
  ICryptoWallet,
  CryptoTransactionType,
  CryptoTransactionStatus,
  ActivityActorType,
  NotificationType,
} from '@/types';

export class CryptoService {
  /**
   * Get all active crypto assets
   */
  static async getAssets(): Promise<ICryptoAsset[]> {
    return CryptoAsset.find({ isActive: true }).sort({ symbol: 1 });
  }

  /**
   * Get user's crypto wallets
   */
  static async getUserWallets(userId: string): Promise<ICryptoWallet[]> {
    return CryptoWallet.find({ user: new Types.ObjectId(userId) });
  }

  /**
   * Get or create wallet for user
   */
  static async getOrCreateWallet(userId: string, asset: string): Promise<ICryptoWallet> {
    let wallet = await CryptoWallet.findOne({
      user: new Types.ObjectId(userId),
      asset: asset.toUpperCase(),
    });

    if (!wallet) {
      wallet = await CryptoWallet.create({
        user: new Types.ObjectId(userId),
        asset: asset.toUpperCase(),
        balance: 0,
      });
    }

    return wallet;
  }

  /**
   * Buy crypto with USD balance
   */
  static async buyCrypto(
    userId: string,
    asset: string,
    usdAmount: number
  ): Promise<ICryptoTransaction> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.balance < usdAmount) {
      throw new Error('Insufficient balance');
    }

    const cryptoAsset = await CryptoAsset.findOne({ symbol: asset.toUpperCase(), isActive: true });
    if (!cryptoAsset) {
      throw new Error('Asset not found or inactive');
    }

    const fee = usdAmount * 0.01; // 1% fee
    const netAmount = usdAmount - fee;
    const cryptoAmount = netAmount / cryptoAsset.price;

    // Deduct USD
    user.balance -= usdAmount;
    await user.save();

    // Credit crypto wallet
    const wallet = await this.getOrCreateWallet(userId, asset);
    await CryptoWallet.findByIdAndUpdate(wallet._id, {
      $inc: { balance: cryptoAmount },
    });

    // Create transaction
    const transaction = await CryptoTransaction.create({
      user: user._id,
      type: CryptoTransactionType.BUY,
      fromAsset: 'USD',
      toAsset: asset.toUpperCase(),
      fromAmount: usdAmount,
      toAmount: cryptoAmount,
      rate: cryptoAsset.price,
      fee,
      status: CryptoTransactionStatus.COMPLETED,
      reference: generateReference('CRY'),
    });

    // Notification
    await Notification.create({
      user: user._id,
      title: 'Crypto Purchase Successful',
      message: `You bought ${cryptoAmount.toFixed(8)} ${asset.toUpperCase()} for $${usdAmount.toFixed(2)}`,
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'buy_crypto',
      resource: 'crypto_transaction',
      resourceId: transaction._id,
      details: { asset, usdAmount, cryptoAmount },
    });

    return transaction;
  }

  /**
   * Sell crypto for USD
   */
  static async sellCrypto(
    userId: string,
    asset: string,
    cryptoAmount: number
  ): Promise<ICryptoTransaction> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const wallet = await CryptoWallet.findOne({
      user: new Types.ObjectId(userId),
      asset: asset.toUpperCase(),
    });

    if (!wallet || wallet.balance < cryptoAmount) {
      throw new Error('Insufficient crypto balance');
    }

    const cryptoAsset = await CryptoAsset.findOne({ symbol: asset.toUpperCase(), isActive: true });
    if (!cryptoAsset) {
      throw new Error('Asset not found or inactive');
    }

    const usdAmount = cryptoAmount * cryptoAsset.price;
    const fee = usdAmount * 0.01; // 1% fee
    const netAmount = usdAmount - fee;

    // Deduct crypto
    await CryptoWallet.findByIdAndUpdate(wallet._id, {
      $inc: { balance: -cryptoAmount },
    });

    // Credit USD
    user.balance += netAmount;
    await user.save();

    // Create transaction
    const transaction = await CryptoTransaction.create({
      user: user._id,
      type: CryptoTransactionType.SELL,
      fromAsset: asset.toUpperCase(),
      toAsset: 'USD',
      fromAmount: cryptoAmount,
      toAmount: netAmount,
      rate: cryptoAsset.price,
      fee,
      status: CryptoTransactionStatus.COMPLETED,
      reference: generateReference('CRY'),
    });

    // Notification
    await Notification.create({
      user: user._id,
      title: 'Crypto Sale Successful',
      message: `You sold ${cryptoAmount.toFixed(8)} ${asset.toUpperCase()} for $${netAmount.toFixed(2)}`,
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'sell_crypto',
      resource: 'crypto_transaction',
      resourceId: transaction._id,
      details: { asset, cryptoAmount, usdAmount: netAmount },
    });

    return transaction;
  }

  /**
   * Swap crypto
   */
  static async swapCrypto(
    userId: string,
    fromAsset: string,
    toAsset: string,
    fromAmount: number
  ): Promise<ICryptoTransaction> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const fromWallet = await CryptoWallet.findOne({
      user: new Types.ObjectId(userId),
      asset: fromAsset.toUpperCase(),
    });

    if (!fromWallet || fromWallet.balance < fromAmount) {
      throw new Error('Insufficient crypto balance');
    }

    const fromCryptoAsset = await CryptoAsset.findOne({ symbol: fromAsset.toUpperCase(), isActive: true });
    const toCryptoAsset = await CryptoAsset.findOne({ symbol: toAsset.toUpperCase(), isActive: true });

    if (!fromCryptoAsset || !toCryptoAsset) {
      throw new Error('Asset not found or inactive');
    }

    // Calculate swap
    const usdValue = fromAmount * fromCryptoAsset.price;
    const fee = usdValue * 0.005; // 0.5% fee
    const netUsdValue = usdValue - fee;
    const toAmount = netUsdValue / toCryptoAsset.price;

    // Deduct from wallet
    await CryptoWallet.findByIdAndUpdate(fromWallet._id, {
      $inc: { balance: -fromAmount },
    });

    // Credit to wallet
    const toWallet = await this.getOrCreateWallet(userId, toAsset);
    await CryptoWallet.findByIdAndUpdate(toWallet._id, {
      $inc: { balance: toAmount },
    });

    // Create transaction
    const transaction = await CryptoTransaction.create({
      user: user._id,
      type: CryptoTransactionType.SWAP,
      fromAsset: fromAsset.toUpperCase(),
      toAsset: toAsset.toUpperCase(),
      fromAmount,
      toAmount,
      rate: fromCryptoAsset.price / toCryptoAsset.price,
      fee,
      status: CryptoTransactionStatus.COMPLETED,
      reference: generateReference('CRY'),
    });

    // Notification
    await Notification.create({
      user: user._id,
      title: 'Crypto Swap Successful',
      message: `You swapped ${fromAmount.toFixed(8)} ${fromAsset.toUpperCase()} for ${toAmount.toFixed(8)} ${toAsset.toUpperCase()}`,
      type: NotificationType.SUCCESS,
    });

    return transaction;
  }

  /**
   * Get user's crypto transactions
   */
  static async getUserTransactions(
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ transactions: ICryptoTransaction[]; total: number }> {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      CryptoTransaction.find({ user: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CryptoTransaction.countDocuments({ user: new Types.ObjectId(userId) }),
    ]);

    return { transactions, total };
  }

  /**
   * Admin: Update asset price
   */
  static async updateAssetPrice(
    symbol: string,
    price: number,
    change24h?: number
  ): Promise<ICryptoAsset> {
    const asset = await CryptoAsset.findOne({ symbol: symbol.toUpperCase() });
    if (!asset) {
      throw new Error('Asset not found');
    }

    asset.price = price;
    if (change24h !== undefined) {
      asset.change24h = change24h;
    }
    await asset.save();

    return asset;
  }

  /**
   * Admin: Create asset
   */
  static async createAsset(data: {
    symbol: string;
    name: string;
    price: number;
    icon?: string;
  }): Promise<ICryptoAsset> {
    return CryptoAsset.create({
      ...data,
      symbol: data.symbol.toUpperCase(),
      isActive: true,
    });
  }
}

export default CryptoService;
