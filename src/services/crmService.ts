import { Types } from 'mongoose';
import { Task, Lead, User, Activity } from '@/models';
import {
  ITask,
  ILead,
  TaskStatus,
  TaskPriority,
  LeadStatus,
  ActivityActorType,
} from '@/types';

export class CrmService {
  // ==================== TASKS ====================

  /**
   * Get all tasks
   */
  static async getAllTasks(
    options: { status?: TaskStatus; priority?: TaskPriority; assignedTo?: string; page?: number; limit?: number } = {}
  ): Promise<{ tasks: ITask[]; total: number }> {
    const { status, priority, assignedTo, page = 1, limit = 10 } = options;
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = new Types.ObjectId(assignedTo);

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email')
        .populate('relatedUser', 'name email accountNumber')
        .sort({ priority: -1, dueDate: 1 })
        .skip(skip)
        .limit(limit),
      Task.countDocuments(query),
    ]);

    return { tasks, total };
  }

  /**
   * Get task by ID
   */
  static async getTaskById(taskId: string): Promise<ITask | null> {
    return Task.findById(taskId)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .populate('relatedUser', 'name email accountNumber');
  }

  /**
   * Create task
   */
  static async createTask(
    data: {
      title: string;
      description?: string;
      assignedTo?: string;
      relatedUser?: string;
      priority?: TaskPriority;
      dueDate?: Date;
    },
    adminId: string
  ): Promise<ITask> {
    const task = await Task.create({
      ...data,
      assignedTo: data.assignedTo ? new Types.ObjectId(data.assignedTo) : undefined,
      relatedUser: data.relatedUser ? new Types.ObjectId(data.relatedUser) : undefined,
      assignedBy: new Types.ObjectId(adminId),
      status: TaskStatus.PENDING,
    });

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'create_task',
      resource: 'task',
      resourceId: task._id,
      details: data,
    });

    return task;
  }

  /**
   * Update task
   */
  static async updateTask(
    taskId: string,
    data: Partial<{
      title: string;
      description: string;
      assignedTo: string;
      priority: TaskPriority;
      status: TaskStatus;
      dueDate: Date;
    }>,
    adminId: string
  ): Promise<ITask> {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (data.assignedTo) {
      task.assignedTo = new Types.ObjectId(data.assignedTo);
      delete data.assignedTo;
    }

    if (data.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      task.completedAt = new Date();
    }

    Object.assign(task, data);
    await task.save();

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_task',
      resource: 'task',
      resourceId: task._id,
      details: data,
    });

    return task;
  }

  /**
   * Delete task
   */
  static async deleteTask(taskId: string, adminId: string): Promise<void> {
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    await Task.findByIdAndDelete(taskId);

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'delete_task',
      resource: 'task',
      details: { taskId, title: task.title },
    });
  }

  // ==================== LEADS ====================

  /**
   * Get all leads
   */
  static async getAllLeads(
    options: { status?: LeadStatus; assignedTo?: string; page?: number; limit?: number } = {}
  ): Promise<{ leads: ILead[]; total: number }> {
    const { status, assignedTo, page = 1, limit = 10 } = options;
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (assignedTo) query.assignedTo = new Types.ObjectId(assignedTo);

    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find(query)
        .populate('assignedTo', 'name email')
        .populate('convertedUser', 'name email accountNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Lead.countDocuments(query),
    ]);

    return { leads, total };
  }

  /**
   * Get lead by ID
   */
  static async getLeadById(leadId: string): Promise<ILead | null> {
    return Lead.findById(leadId)
      .populate('assignedTo', 'name email')
      .populate('convertedUser', 'name email accountNumber');
  }

  /**
   * Create lead
   */
  static async createLead(
    data: {
      name: string;
      email: string;
      phone?: string;
      source?: string;
      notes?: string;
      assignedTo?: string;
    },
    adminId: string
  ): Promise<ILead> {
    const lead = await Lead.create({
      ...data,
      assignedTo: data.assignedTo ? new Types.ObjectId(data.assignedTo) : undefined,
      status: LeadStatus.NEW,
    });

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'create_lead',
      resource: 'lead',
      resourceId: lead._id,
      details: data,
    });

    return lead;
  }

  /**
   * Update lead
   */
  static async updateLead(
    leadId: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      source: string;
      notes: string;
      assignedTo: string;
      status: LeadStatus;
    }>,
    adminId: string
  ): Promise<ILead> {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    if (data.assignedTo) {
      lead.assignedTo = new Types.ObjectId(data.assignedTo);
      delete data.assignedTo;
    }

    Object.assign(lead, data);
    await lead.save();

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_lead',
      resource: 'lead',
      resourceId: lead._id,
      details: data,
    });

    return lead;
  }

  /**
   * Convert lead to user
   */
  static async convertLead(leadId: string, userId: string, adminId: string): Promise<ILead> {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    lead.status = LeadStatus.CONVERTED;
    lead.convertedUser = user._id;
    lead.convertedAt = new Date();
    await lead.save();

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'convert_lead',
      resource: 'lead',
      resourceId: lead._id,
      details: { userId },
    });

    return lead;
  }

  /**
   * Delete lead
   */
  static async deleteLead(leadId: string, adminId: string): Promise<void> {
    const lead = await Lead.findById(leadId);
    if (!lead) {
      throw new Error('Lead not found');
    }

    await Lead.findByIdAndDelete(leadId);

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'delete_lead',
      resource: 'lead',
      details: { leadId, name: lead.name, email: lead.email },
    });
  }

  /**
   * Get CRM stats
   */
  static async getStats(): Promise<{
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    totalLeads: number;
    newLeads: number;
    convertedLeads: number;
  }> {
    const [
      totalTasks,
      pendingTasks,
      completedTasks,
      totalLeads,
      newLeads,
      convertedLeads,
    ] = await Promise.all([
      Task.countDocuments(),
      Task.countDocuments({ status: { $in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] } }),
      Task.countDocuments({ status: TaskStatus.COMPLETED }),
      Lead.countDocuments(),
      Lead.countDocuments({ status: LeadStatus.NEW }),
      Lead.countDocuments({ status: LeadStatus.CONVERTED }),
    ]);

    return {
      totalTasks,
      pendingTasks,
      completedTasks,
      totalLeads,
      newLeads,
      convertedLeads,
    };
  }
}

export default CrmService;
