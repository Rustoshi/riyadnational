import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { MembershipService } from '@/services/membershipService';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { admin, error } = await authenticateAdmin(request);
    if (error || !admin) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'courses') {
      const membershipId = searchParams.get('membershipId') || undefined;
      const courses = await MembershipService.getCourses(membershipId);
      return successResponse(courses, 'Courses retrieved successfully');
    }

    const memberships = await MembershipService.getActiveMemberships();
    return successResponse(memberships, 'Memberships retrieved successfully');
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

    if (type === 'course') {
      const { title, description, thumbnail, videoUrl, duration, order, membership } = data;
      if (!title || !description) {
        return errorResponse('Title and description are required', 400);
      }
      const course = await MembershipService.createCourse(
        { title, description, thumbnail, videoUrl, duration, order, membership },
        admin._id.toString()
      );
      return successResponse(course, 'Course created successfully', 201);
    }

    const { name, description, price, durationDays, features } = data;
    if (!name || !description || !price || !durationDays) {
      return errorResponse('Name, description, price, and duration are required', 400);
    }

    const membership = await MembershipService.createMembership(
      { name, description, price, durationDays, features },
      admin._id.toString()
    );
    return successResponse(membership, 'Membership created successfully', 201);
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
    const { type, membershipId, courseId, ...data } = body;

    if (type === 'course' && courseId) {
      const course = await MembershipService.updateCourse(courseId, data, admin._id.toString());
      return successResponse(course, 'Course updated successfully');
    }

    if (!membershipId) {
      return errorResponse('Membership ID is required', 400);
    }

    const membership = await MembershipService.updateMembership(
      membershipId,
      data,
      admin._id.toString()
    );
    return successResponse(membership, 'Membership updated successfully');
  } catch (error) {
    return handleError(error);
  }
}
