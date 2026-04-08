import { Types } from 'mongoose';
import { Membership, Course, Enrollment, User, Transaction, Activity, Notification } from '@/models';
import {
  IMembership,
  ICourse,
  IEnrollment,
  MembershipStatus,
  CourseStatus,
  EnrollmentStatus,
  TransactionType,
  TransactionStatus,
  ActivityActorType,
  NotificationType,
} from '@/types';

export class MembershipService {
  /**
   * Get all active memberships
   */
  static async getActiveMemberships(): Promise<IMembership[]> {
    return Membership.find({ status: MembershipStatus.ACTIVE }).sort({ price: 1 });
  }

  /**
   * Get membership by ID
   */
  static async getMembershipById(membershipId: string): Promise<IMembership | null> {
    return Membership.findById(membershipId);
  }

  /**
   * Subscribe to membership
   */
  static async subscribe(userId: string, membershipId: string): Promise<IEnrollment> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const membership = await Membership.findById(membershipId);
    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new Error('Membership not found or inactive');
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      membership: membershipId,
      status: EnrollmentStatus.ACTIVE,
      endDate: { $gte: new Date() },
    });

    if (existingEnrollment) {
      throw new Error('Already enrolled in this membership');
    }

    if (user.balance < membership.price) {
      throw new Error('Insufficient balance');
    }

    // Deduct balance
    const balanceBefore = user.balance;
    user.balance -= membership.price;
    await user.save();

    // Create enrollment
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + membership.durationDays);

    const enrollment = await Enrollment.create({
      user: user._id,
      membership: membership._id,
      startDate,
      endDate,
      status: EnrollmentStatus.ACTIVE,
    });

    // Create transaction
    await Transaction.create({
      user: user._id,
      type: TransactionType.FEE,
      amount: membership.price,
      balanceBefore,
      balanceAfter: user.balance,
      status: TransactionStatus.COMPLETED,
      description: `Membership subscription: ${membership.name}`,
      metadata: { membershipId: membership._id, enrollmentId: enrollment._id },
    });

    // Notification
    await Notification.create({
      user: user._id,
      title: 'Membership Activated',
      message: `Your ${membership.name} membership is now active until ${endDate.toLocaleDateString()}.`,
      type: NotificationType.SUCCESS,
    });

    // Log activity
    await Activity.create({
      actor: user._id,
      actorType: ActivityActorType.USER,
      action: 'subscribe_membership',
      resource: 'enrollment',
      resourceId: enrollment._id,
      details: { membershipId, price: membership.price },
    });

    return enrollment;
  }

  /**
   * Get user's enrollments
   */
  static async getUserEnrollments(
    userId: string,
    options: { activeOnly?: boolean } = {}
  ): Promise<IEnrollment[]> {
    const query: Record<string, unknown> = { user: new Types.ObjectId(userId) };
    if (options.activeOnly) {
      query.status = EnrollmentStatus.ACTIVE;
      query.endDate = { $gte: new Date() };
    }
    return Enrollment.find(query).populate('membership').sort({ createdAt: -1 });
  }

  /**
   * Get courses for membership
   */
  static async getCourses(membershipId?: string): Promise<ICourse[]> {
    const query: Record<string, unknown> = { status: CourseStatus.PUBLISHED };
    if (membershipId) {
      query.membership = new Types.ObjectId(membershipId);
    }
    return Course.find(query).sort({ order: 1 });
  }

  /**
   * Check if user has access to course
   */
  static async hasAccess(userId: string, courseId: string): Promise<boolean> {
    const course = await Course.findById(courseId);
    if (!course) {
      return false;
    }

    // If course has no membership requirement, it's free
    if (!course.membership) {
      return true;
    }

    // Check if user has active enrollment
    const enrollment = await Enrollment.findOne({
      user: new Types.ObjectId(userId),
      membership: course.membership,
      status: EnrollmentStatus.ACTIVE,
      endDate: { $gte: new Date() },
    });

    return !!enrollment;
  }

  /**
   * Admin: Create membership
   */
  static async createMembership(
    data: {
      name: string;
      description: string;
      price: number;
      durationDays: number;
      features?: string[];
    },
    adminId: string
  ): Promise<IMembership> {
    const membership = await Membership.create(data);

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'create_membership',
      resource: 'membership',
      resourceId: membership._id,
      details: data,
    });

    return membership;
  }

  /**
   * Admin: Update membership
   */
  static async updateMembership(
    membershipId: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      durationDays: number;
      features: string[];
      status: MembershipStatus;
    }>,
    adminId: string
  ): Promise<IMembership> {
    const membership = await Membership.findById(membershipId);
    if (!membership) {
      throw new Error('Membership not found');
    }

    Object.assign(membership, data);
    await membership.save();

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_membership',
      resource: 'membership',
      resourceId: membership._id,
      details: data,
    });

    return membership;
  }

  /**
   * Admin: Create course
   */
  static async createCourse(
    data: {
      title: string;
      description: string;
      thumbnail?: string;
      videoUrl?: string;
      duration?: number;
      order?: number;
      membership?: string;
    },
    adminId: string
  ): Promise<ICourse> {
    const course = await Course.create({
      ...data,
      membership: data.membership ? new Types.ObjectId(data.membership) : undefined,
      status: CourseStatus.DRAFT,
    });

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'create_course',
      resource: 'course',
      resourceId: course._id,
      details: data,
    });

    return course;
  }

  /**
   * Admin: Update course
   */
  static async updateCourse(
    courseId: string,
    data: Partial<{
      title: string;
      description: string;
      thumbnail: string;
      videoUrl: string;
      duration: number;
      order: number;
      membership: string;
      status: CourseStatus;
    }>,
    adminId: string
  ): Promise<ICourse> {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    if (data.membership) {
      course.membership = new Types.ObjectId(data.membership);
      delete data.membership;
    }
    Object.assign(course, data);
    await course.save();

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_course',
      resource: 'course',
      resourceId: course._id,
      details: data,
    });

    return course;
  }
}

export default MembershipService;
