import { Types } from 'mongoose';
import { Transaction, Deposit, Withdrawal, Transfer, Activity } from '@/models';
import { ActivityActorType } from '@/types';

export class ExportService {
  /**
   * Export user transactions to CSV format
   */
  static async exportUserTransactions(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      type?: string;
    } = {}
  ): Promise<string> {
    const query: Record<string, unknown> = { user: new Types.ObjectId(userId) };
    
    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) {
        (query.createdAt as Record<string, Date>).$gte = options.startDate;
      }
      if (options.endDate) {
        (query.createdAt as Record<string, Date>).$lte = options.endDate;
      }
    }
    
    if (options.type) {
      query.type = options.type;
    }

    const transactions = await Transaction.find(query).sort({ createdAt: -1 });

    // Generate CSV
    const headers = ['Date', 'Type', 'Amount', 'Balance Before', 'Balance After', 'Status', 'Description', 'Reference'];
    const rows = transactions.map(t => [
      t.createdAt.toISOString(),
      t.type,
      t.amount.toFixed(2),
      t.balanceBefore.toFixed(2),
      t.balanceAfter.toFixed(2),
      t.status,
      t.description,
      t.reference,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    await Activity.create({
      actor: new Types.ObjectId(userId),
      actorType: ActivityActorType.USER,
      action: 'export_transactions',
      resource: 'transaction',
      details: { count: transactions.length },
    });

    return csv;
  }

  /**
   * Export deposits to CSV
   */
  static async exportDeposits(
    options: {
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      status?: string;
    } = {},
    adminId?: string
  ): Promise<string> {
    const query: Record<string, unknown> = {};
    
    if (options.userId) {
      query.user = new Types.ObjectId(options.userId);
    }
    
    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) {
        (query.createdAt as Record<string, Date>).$gte = options.startDate;
      }
      if (options.endDate) {
        (query.createdAt as Record<string, Date>).$lte = options.endDate;
      }
    }
    
    if (options.status) {
      query.status = options.status;
    }

    const deposits = await Deposit.find(query)
      .populate('user', 'name email accountNumber')
      .sort({ createdAt: -1 });

    const headers = ['Date', 'User', 'Email', 'Amount', 'Method', 'Status', 'Reference'];
    const rows = deposits.map(d => {
      const user = d.user as unknown as { name: string; email: string };
      return [
        d.createdAt.toISOString(),
        user?.name || 'N/A',
        user?.email || 'N/A',
        d.amount.toFixed(2),
        d.paymentMethod,
        d.status,
        d.reference,
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    if (adminId) {
      await Activity.create({
        actor: new Types.ObjectId(adminId),
        actorType: ActivityActorType.ADMIN,
        action: 'export_deposits',
        resource: 'deposit',
        details: { count: deposits.length },
      });
    }

    return csv;
  }

  /**
   * Export withdrawals to CSV
   */
  static async exportWithdrawals(
    options: {
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      status?: string;
    } = {},
    adminId?: string
  ): Promise<string> {
    const query: Record<string, unknown> = {};
    
    if (options.userId) {
      query.user = new Types.ObjectId(options.userId);
    }
    
    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) {
        (query.createdAt as Record<string, Date>).$gte = options.startDate;
      }
      if (options.endDate) {
        (query.createdAt as Record<string, Date>).$lte = options.endDate;
      }
    }
    
    if (options.status) {
      query.status = options.status;
    }

    const withdrawals = await Withdrawal.find(query)
      .populate('user', 'name email accountNumber')
      .sort({ createdAt: -1 });

    const headers = ['Date', 'User', 'Email', 'Amount', 'Method', 'Status', 'Reference'];
    const rows = withdrawals.map(w => {
      const user = w.user as unknown as { name: string; email: string };
      return [
        w.createdAt.toISOString(),
        user?.name || 'N/A',
        user?.email || 'N/A',
        w.amount.toFixed(2),
        w.paymentMethod,
        w.status,
        w.reference,
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    if (adminId) {
      await Activity.create({
        actor: new Types.ObjectId(adminId),
        actorType: ActivityActorType.ADMIN,
        action: 'export_withdrawals',
        resource: 'withdrawal',
        details: { count: withdrawals.length },
      });
    }

    return csv;
  }

  /**
   * Export transfers to CSV
   */
  static async exportTransfers(
    options: {
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      status?: string;
    } = {},
    adminId?: string
  ): Promise<string> {
    const query: Record<string, unknown> = {};
    
    if (options.userId) {
      query.sender = new Types.ObjectId(options.userId);
    }
    
    if (options.startDate || options.endDate) {
      query.createdAt = {};
      if (options.startDate) {
        (query.createdAt as Record<string, Date>).$gte = options.startDate;
      }
      if (options.endDate) {
        (query.createdAt as Record<string, Date>).$lte = options.endDate;
      }
    }
    
    if (options.status) {
      query.status = options.status;
    }

    const transfers = await Transfer.find(query)
      .populate('sender', 'name email accountNumber')
      .sort({ createdAt: -1 });

    const headers = ['Date', 'Sender', 'Type', 'Amount', 'Recipient', 'Status', 'Reference'];
    const rows = transfers.map(t => {
      const sender = t.sender as unknown as { name: string };
      return [
        t.createdAt.toISOString(),
        sender?.name || 'N/A',
        t.type,
        t.amount.toFixed(2),
        t.recipientDetails?.accountName || t.recipientDetails?.accountNumber || 'N/A',
        t.status,
        t.reference,
      ];
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    if (adminId) {
      await Activity.create({
        actor: new Types.ObjectId(adminId),
        actorType: ActivityActorType.ADMIN,
        action: 'export_transfers',
        resource: 'transfer',
        details: { count: transfers.length },
      });
    }

    return csv;
  }

  /**
   * Export all user data (GDPR compliance)
   */
  static async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const [transactions, deposits, withdrawals, transfers] = await Promise.all([
      Transaction.find({ user: new Types.ObjectId(userId) }).sort({ createdAt: -1 }),
      Deposit.find({ user: new Types.ObjectId(userId) }).sort({ createdAt: -1 }),
      Withdrawal.find({ user: new Types.ObjectId(userId) }).sort({ createdAt: -1 }),
      Transfer.find({ sender: new Types.ObjectId(userId) }).sort({ createdAt: -1 }),
    ]);

    return {
      transactions: transactions.map(t => t.toObject()),
      deposits: deposits.map(d => d.toObject()),
      withdrawals: withdrawals.map(w => w.toObject()),
      transfers: transfers.map(t => t.toObject()),
      exportedAt: new Date().toISOString(),
    };
  }
}

export default ExportService;
