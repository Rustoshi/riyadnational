import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { MembershipService } from '@/services/membershipService';
import { successResponse, unauthorizedResponse, errorResponse, handleError } from '@/lib/apiResponse';
import { authenticateUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'available') {
      const memberships = await MembershipService.getActiveMemberships();
      return successResponse(memberships, 'Available memberships retrieved successfully');
    }

    if (type === 'courses') {
      const membershipId = searchParams.get('membershipId') || undefined;
      const courses = await MembershipService.getCourses(membershipId);
      return successResponse(courses, 'Courses retrieved successfully');
    }

    // Default: return user enrollments
    const enrollments = await MembershipService.getUserEnrollments(user._id.toString(), {
      activeOnly: searchParams.get('activeOnly') === 'true',
    });
    return successResponse(enrollments, 'Enrollments retrieved successfully');
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { user, error } = await authenticateUser(request);
    if (error || !user) {
      return unauthorizedResponse(error || 'Unauthorized');
    }

    const body = await request.json();
    const { membershipId } = body;

    if (!membershipId) {
      return errorResponse('Membership ID is required', 400);
    }

    const enrollment = await MembershipService.subscribe(user._id.toString(), membershipId);

    return successResponse(enrollment, 'Successfully subscribed to membership', 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Insufficient') || error.message.includes('Already')) {
        return errorResponse(error.message, 400);
      }
    }
    return handleError(error);
  }
}
