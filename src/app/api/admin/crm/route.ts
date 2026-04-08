import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { CrmService } from '@/services/crmService';
import { successResponse, paginatedResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';
import { createPaginationResponse } from '@/lib/utils';
import { TaskStatus, TaskPriority, LeadStatus } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (type === 'stats') {
      const stats = await CrmService.getStats();
      return successResponse(stats, 'CRM stats retrieved successfully');
    }

    if (type === 'leads') {
      const status = searchParams.get('status') as LeadStatus | undefined;
      const assignedTo = searchParams.get('assignedTo') || undefined;
      const { leads, total } = await CrmService.getAllLeads({ status, assignedTo, page, limit });
      return paginatedResponse(
        leads,
        createPaginationResponse(total, page, limit),
        'Leads retrieved successfully'
      );
    }

    // Default: tasks
    const status = searchParams.get('status') as TaskStatus | undefined;
    const priority = searchParams.get('priority') as TaskPriority | undefined;
    const assignedTo = searchParams.get('assignedTo') || undefined;
    const { tasks, total } = await CrmService.getAllTasks({ status, priority, assignedTo, page, limit });

    return paginatedResponse(
      tasks,
      createPaginationResponse(total, page, limit),
      'Tasks retrieved successfully'
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'lead') {
      const { name, email, phone, source, notes, assignedTo } = data;
      if (!name || !email) {
        return errorResponse('Name and email are required', 400);
      }
      const lead = await CrmService.createLead(
        { name, email, phone, source, notes, assignedTo },
        admin._id.toString()
      );
      return successResponse(lead, 'Lead created successfully', 201);
    }

    // Default: task
    const { title, description, assignedTo, relatedUser, priority, dueDate } = data;
    if (!title) {
      return errorResponse('Title is required', 400);
    }

    const task = await CrmService.createTask(
      { title, description, assignedTo, relatedUser, priority, dueDate },
      admin._id.toString()
    );
    return successResponse(task, 'Task created successfully', 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { type, taskId, leadId, userId, ...data } = body;

    if (type === 'lead') {
      if (!leadId) {
        return errorResponse('Lead ID is required', 400);
      }
      
      if (data.action === 'convert' && userId) {
        const lead = await CrmService.convertLead(leadId, userId, admin._id.toString());
        return successResponse(lead, 'Lead converted successfully');
      }

      const lead = await CrmService.updateLead(leadId, data, admin._id.toString());
      return successResponse(lead, 'Lead updated successfully');
    }

    // Default: task
    if (!taskId) {
      return errorResponse('Task ID is required', 400);
    }

    const task = await CrmService.updateTask(taskId, data, admin._id.toString());
    return successResponse(task, 'Task updated successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const taskId = searchParams.get('taskId');
    const leadId = searchParams.get('leadId');

    if (type === 'lead' && leadId) {
      await CrmService.deleteLead(leadId, admin._id.toString());
      return successResponse(null, 'Lead deleted successfully');
    }

    if (taskId) {
      await CrmService.deleteTask(taskId, admin._id.toString());
      return successResponse(null, 'Task deleted successfully');
    }

    return errorResponse('Task ID or Lead ID is required', 400);
  } catch (error) {
    return handleError(error);
  }
}
