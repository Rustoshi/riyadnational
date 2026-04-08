import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db';
import { CmsService } from '@/services/cmsService';
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
    const key = searchParams.get('key');

    if (type === 'faqs') {
      const faqs = await CmsService.getAllFaqs();
      return successResponse(faqs, 'FAQs retrieved successfully');
    }

    if (type === 'testimonials') {
      const testimonials = await CmsService.getAllTestimonials();
      return successResponse(testimonials, 'Testimonials retrieved successfully');
    }

    if (type === 'content' && key) {
      const content = await CmsService.getContent(key);
      return successResponse(content, 'Content retrieved successfully');
    }

    if (type === 'contents') {
      const contents = await CmsService.getAllContent();
      return successResponse(contents, 'All content retrieved successfully');
    }

    // Get predefined content
    if (type === 'privacy') {
      const content = await CmsService.getPrivacyPolicy();
      return successResponse({ content }, 'Privacy policy retrieved successfully');
    }

    if (type === 'terms') {
      const content = await CmsService.getTermsOfService();
      return successResponse({ content }, 'Terms of service retrieved successfully');
    }

    if (type === 'about') {
      const content = await CmsService.getAboutUs();
      return successResponse({ content }, 'About us retrieved successfully');
    }

    return errorResponse('Invalid type parameter', 400);
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

    if (type === 'faq') {
      if (!data.question || !data.answer) {
        return errorResponse('Question and answer are required', 400);
      }
      const faq = await CmsService.createFaq(data, admin._id.toString());
      return successResponse(faq, 'FAQ created successfully', 201);
    }

    if (type === 'testimonial') {
      if (!data.name || !data.content) {
        return errorResponse('Name and content are required', 400);
      }
      const testimonial = await CmsService.createTestimonial(data, admin._id.toString());
      return successResponse(testimonial, 'Testimonial created successfully', 201);
    }

    if (type === 'content') {
      if (!data.key || !data.content) {
        return errorResponse('Key and content are required', 400);
      }
      const content = await CmsService.setContent(data.key, data, admin._id.toString());
      return successResponse(content, 'Content saved successfully', 201);
    }

    return errorResponse('Invalid type parameter', 400);
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
    const { type, id, key, ...data } = body;

    if (type === 'faq' && id) {
      const faq = await CmsService.updateFaq(id, data, admin._id.toString());
      return successResponse(faq, 'FAQ updated successfully');
    }

    if (type === 'testimonial' && id) {
      const testimonial = await CmsService.updateTestimonial(id, data, admin._id.toString());
      return successResponse(testimonial, 'Testimonial updated successfully');
    }

    if (type === 'privacy') {
      await CmsService.setPrivacyPolicy(data.content, admin._id.toString());
      return successResponse(null, 'Privacy policy updated successfully');
    }

    if (type === 'terms') {
      await CmsService.setTermsOfService(data.content, admin._id.toString());
      return successResponse(null, 'Terms of service updated successfully');
    }

    if (type === 'about') {
      await CmsService.setAboutUs(data.content, admin._id.toString());
      return successResponse(null, 'About us updated successfully');
    }

    if (type === 'content' && key) {
      const content = await CmsService.setContent(key, data, admin._id.toString());
      return successResponse(content, 'Content updated successfully');
    }

    return errorResponse('Invalid type or missing ID', 400);
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
    const id = searchParams.get('id');
    const key = searchParams.get('key');

    if (type === 'faq' && id) {
      await CmsService.deleteFaq(id, admin._id.toString());
      return successResponse(null, 'FAQ deleted successfully');
    }

    if (type === 'testimonial' && id) {
      await CmsService.deleteTestimonial(id, admin._id.toString());
      return successResponse(null, 'Testimonial deleted successfully');
    }

    if (type === 'content' && key) {
      await CmsService.deleteContent(key, admin._id.toString());
      return successResponse(null, 'Content deleted successfully');
    }

    return errorResponse('Invalid type or missing ID/key', 400);
  } catch (error) {
    return handleError(error);
  }
}
