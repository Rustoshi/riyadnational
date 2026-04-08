import { Types } from 'mongoose';
import { Plan, UserPlan, User, Transaction, Activity, Notification } from '@/models';
import { calculateInvestmentReturn } from '@/lib/utils';
import {
  IPlan,
  IUserPlan,
  PlanStatus,
  UserPlanStatus,
  TransactionType,
  TransactionStatus,
  ActivityActorType,
  NotificationType,
} from '@/types';

export class PlanService {
  /**
   * Get all active plans
   */
  static async getActivePlans(): Promise<IPlan[]> {
    return Plan.find({ status: PlanStatus.ACTIVE }).sort({ minAmount: 1 });
  }

  /**
   * Get plan by ID
   */
  static async getPlanById(planId: string): Promise<IPlan | null> {
    return Plan.findById(planId);
  }

  /**
   * Subscribe to a plan
   */
  static async subscribeToPlan(
    userId: string,
    planId: string,
    amount: number
  ): Promise<IUserPlan> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    if (plan.status !== PlanStatus.ACTIVE) {
      throw new Error('Plan is not active');
    }

    if (amount < plan.minAmount || amount > plan.maxAmount) {
      throw new Error(`Amount must be between $${plan.minAmount} and $${plan.maxAmount}`);
    }

    if (user.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Deduct from user balance
    const balanceBefore = user.balance;
    user.balance -= amount;
    await user.save();

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    // Calculate expected return
    const expectedReturn = calculateInvestmentReturn(amount, plan.returnPercentage);

    // Create user plan
    const userPlan = await UserPlan.create({
      user: user._id,
      plan: plan._id,
      amount,
      expectedReturn,
      startDate,
      endDate,
      status: UserPlanStatus.ACTIVE,
    });

    // Create transaction
    await Transaction.create({
      user: user._id,
      type: TransactionType.INVESTMENT,
      amount,
      balanceBefore,
      balanceAfter: user.balance,
      status: TransactionStatus.COMPLETED,
      description: `Investment in ${plan.name}`,
      metadata: { planId: plan._id, userPlanId: userPlan._id },
    });

    // Create notification
    await Notification.create({
      user: user._id,
      title: 'Investment Successful',
      message: `You have successfully invested $${amount.toFixed(2)} in ${plan.name}. Expected return: $${expectedReturn.toFixed(2)}`,
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'subscribe_plan',
      resource: 'user_plan',
      resourceId: userPlan._id,
      details: { planId, amount, expectedReturn },
    });

    return userPlan;
  }

  /**
   * Get user's active plans
   */
  static async getUserPlans(
    userId: string,
    options: { status?: UserPlanStatus; page?: number; limit?: number } = {}
  ): Promise<{ userPlans: IUserPlan[]; total: number }> {
    const { status, page = 1, limit = 10 } = options;
    const query: Record<string, unknown> = { user: new Types.ObjectId(userId) };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [userPlans, total] = await Promise.all([
      UserPlan.find(query)
        .populate('plan')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      UserPlan.countDocuments(query),
    ]);

    return { userPlans, total };
  }

  /**
   * Cancel user plan
   */
  static async cancelPlan(userPlanId: string, userId: string): Promise<IUserPlan> {
    const userPlan = await UserPlan.findOne({ _id: userPlanId, user: userId });
    if (!userPlan) {
      throw new Error('Plan not found');
    }

    if (userPlan.status !== UserPlanStatus.ACTIVE) {
      throw new Error('Plan is not active');
    }

    // Refund the amount (without profit)
    const user = await User.findById(userId);
    if (user) {
      user.balance += userPlan.amount;
      await user.save();

      // Create refund transaction
      await Transaction.create({
        user: user._id,
        type: TransactionType.INVESTMENT,
        amount: userPlan.amount,
        balanceBefore: user.balance - userPlan.amount,
        balanceAfter: user.balance,
        status: TransactionStatus.COMPLETED,
        description: 'Investment plan cancelled - refund',
        metadata: { userPlanId: userPlan._id },
      });
    }

    userPlan.status = UserPlanStatus.CANCELLED;
    await userPlan.save();

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(userId),
      actorType: ActivityActorType.USER,
      action: 'cancel_plan',
      resource: 'user_plan',
      resourceId: userPlan._id,
    });

    return userPlan;
  }

  /**
   * Admin: Get all plans
   */
  static async getAllPlans(
    options: { status?: PlanStatus; page?: number; limit?: number } = {}
  ): Promise<{ plans: IPlan[]; total: number }> {
    const { status, page = 1, limit = 10 } = options;
    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [plans, total] = await Promise.all([
      Plan.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Plan.countDocuments(query),
    ]);

    return { plans, total };
  }

  /**
   * Admin: Create plan
   */
  static async createPlan(
    data: {
      name: string;
      description: string;
      minAmount: number;
      maxAmount: number;
      returnPercentage: number;
      durationDays: number;
      features?: string[];
      status?: PlanStatus;
    },
    adminId: string
  ): Promise<IPlan> {
    const plan = await Plan.create(data);

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'create_plan',
      resource: 'plan',
      resourceId: plan._id,
      details: data,
    });

    return plan;
  }

  /**
   * Admin: Update plan
   */
  static async updatePlan(
    planId: string,
    data: Partial<{
      name: string;
      description: string;
      minAmount: number;
      maxAmount: number;
      returnPercentage: number;
      durationDays: number;
      features: string[];
      status: PlanStatus;
    }>,
    adminId: string
  ): Promise<IPlan> {
    const plan = await Plan.findById(planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    Object.assign(plan, data);
    await plan.save();

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_plan',
      resource: 'plan',
      resourceId: plan._id,
      details: data,
    });

    return plan;
  }

  /**
   * Admin: Delete plan
   */
  static async deletePlan(planId: string, adminId: string): Promise<void> {
    const plan = await Plan.findById(planId);
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Check if there are active subscriptions
    const activeSubscriptions = await UserPlan.countDocuments({
      plan: planId,
      status: UserPlanStatus.ACTIVE,
    });

    if (activeSubscriptions > 0) {
      throw new Error('Cannot delete plan with active subscriptions');
    }

    await Plan.findByIdAndDelete(planId);

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'delete_plan',
      resource: 'plan',
      details: { planId, name: plan.name },
    });
  }

  /**
   * Admin: Get all user plans
   */
  static async getAllUserPlans(
    options: { status?: UserPlanStatus; page?: number; limit?: number } = {}
  ): Promise<{ userPlans: IUserPlan[]; total: number }> {
    const { status, page = 1, limit = 10 } = options;
    const query: Record<string, unknown> = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [userPlans, total] = await Promise.all([
      UserPlan.find(query)
        .populate('user', 'name email accountNumber')
        .populate('plan')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      UserPlan.countDocuments(query),
    ]);

    return { userPlans, total };
  }

  /**
   * Admin: Complete user plan (pay returns)
   */
  static async completePlan(userPlanId: string, adminId: string): Promise<IUserPlan> {
    const userPlan = await UserPlan.findById(userPlanId).populate('plan');
    if (!userPlan) {
      throw new Error('User plan not found');
    }

    if (userPlan.status !== UserPlanStatus.ACTIVE) {
      throw new Error('Plan is not active');
    }

    const user = await User.findById(userPlan.user);
    if (!user) {
      throw new Error('User not found');
    }

    // Credit the expected return
    const balanceBefore = user.balance;
    user.balance += userPlan.expectedReturn;
    await user.save();

    // Update user plan
    userPlan.status = UserPlanStatus.COMPLETED;
    userPlan.returnPaid = true;
    await userPlan.save();

    // Create transaction
    await Transaction.create({
      user: user._id,
      type: TransactionType.INVESTMENT,
      amount: userPlan.expectedReturn,
      balanceBefore,
      balanceAfter: user.balance,
      status: TransactionStatus.COMPLETED,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      description: `Investment return - ${(userPlan.plan as any).name}`,
      metadata: { userPlanId: userPlan._id },
    });

    // Notify user
    await Notification.create({
      user: user._id,
      title: 'Investment Matured',
      message: `Your investment has matured! $${userPlan.expectedReturn.toFixed(2)} has been credited to your account.`,
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'complete_plan',
      resource: 'user_plan',
      resourceId: userPlan._id,
      details: { amount: userPlan.expectedReturn },
    });

    return userPlan;
  }
}

export default PlanService;
