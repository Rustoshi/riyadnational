import { Types } from 'mongoose';
import { Faq, Testimonial, Content, Activity } from '@/models';
import { IFaq } from '@/models/Faq';
import { ITestimonial } from '@/models/Testimonial';
import { IContent } from '@/models/Content';
import { ActivityActorType } from '@/types';

export class CmsService {
  // ==================== FAQ ====================

  /**
   * Get all FAQs
   */
  static async getAllFaqs(activeOnly: boolean = false): Promise<IFaq[]> {
    const query = activeOnly ? { isActive: true } : {};
    return Faq.find(query).sort({ order: 1 });
  }

  /**
   * Get FAQ by ID
   */
  static async getFaqById(faqId: string): Promise<IFaq | null> {
    return Faq.findById(faqId);
  }

  /**
   * Create FAQ
   */
  static async createFaq(
    data: { question: string; answer: string; order?: number },
    adminId: string
  ): Promise<IFaq> {
    const faq = await Faq.create(data);

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'create_faq',
      resource: 'faq',
      resourceId: faq._id,
    });

    return faq;
  }

  /**
   * Update FAQ
   */
  static async updateFaq(
    faqId: string,
    data: Partial<{ question: string; answer: string; order: number; isActive: boolean }>,
    adminId: string
  ): Promise<IFaq> {
    const faq = await Faq.findById(faqId);
    if (!faq) {
      throw new Error('FAQ not found');
    }

    Object.assign(faq, data);
    await faq.save();

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_faq',
      resource: 'faq',
      resourceId: faq._id,
    });

    return faq;
  }

  /**
   * Delete FAQ
   */
  static async deleteFaq(faqId: string, adminId: string): Promise<void> {
    const faq = await Faq.findById(faqId);
    if (!faq) {
      throw new Error('FAQ not found');
    }

    await Faq.findByIdAndDelete(faqId);

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'delete_faq',
      resource: 'faq',
      details: { question: faq.question },
    });
  }

  // ==================== TESTIMONIALS ====================

  /**
   * Get all testimonials
   */
  static async getAllTestimonials(activeOnly: boolean = false): Promise<ITestimonial[]> {
    const query = activeOnly ? { isActive: true } : {};
    return Testimonial.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get testimonial by ID
   */
  static async getTestimonialById(testimonialId: string): Promise<ITestimonial | null> {
    return Testimonial.findById(testimonialId);
  }

  /**
   * Create testimonial
   */
  static async createTestimonial(
    data: { name: string; role?: string; content: string; avatar?: string; rating?: number },
    adminId: string
  ): Promise<ITestimonial> {
    const testimonial = await Testimonial.create(data);

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'create_testimonial',
      resource: 'testimonial',
      resourceId: testimonial._id,
    });

    return testimonial;
  }

  /**
   * Update testimonial
   */
  static async updateTestimonial(
    testimonialId: string,
    data: Partial<{ name: string; role: string; content: string; avatar: string; rating: number; isActive: boolean }>,
    adminId: string
  ): Promise<ITestimonial> {
    const testimonial = await Testimonial.findById(testimonialId);
    if (!testimonial) {
      throw new Error('Testimonial not found');
    }

    Object.assign(testimonial, data);
    await testimonial.save();

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_testimonial',
      resource: 'testimonial',
      resourceId: testimonial._id,
    });

    return testimonial;
  }

  /**
   * Delete testimonial
   */
  static async deleteTestimonial(testimonialId: string, adminId: string): Promise<void> {
    const testimonial = await Testimonial.findById(testimonialId);
    if (!testimonial) {
      throw new Error('Testimonial not found');
    }

    await Testimonial.findByIdAndDelete(testimonialId);

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'delete_testimonial',
      resource: 'testimonial',
      details: { name: testimonial.name },
    });
  }

  // ==================== CONTENT ====================

  /**
   * Get content by key
   */
  static async getContent(key: string): Promise<IContent | null> {
    return Content.findOne({ key });
  }

  /**
   * Get all content
   */
  static async getAllContent(): Promise<IContent[]> {
    return Content.find().sort({ key: 1 });
  }

  /**
   * Set content
   */
  static async setContent(
    key: string,
    data: { title?: string; content: string; type?: 'text' | 'html' | 'json' },
    adminId: string
  ): Promise<IContent> {
    let content = await Content.findOne({ key });
    
    if (content) {
      Object.assign(content, data);
      await content.save();
    } else {
      content = await Content.create({ key, ...data });
    }

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'update_content',
      resource: 'content',
      details: { key },
    });

    return content;
  }

  /**
   * Delete content
   */
  static async deleteContent(key: string, adminId: string): Promise<void> {
    const content = await Content.findOne({ key });
    if (!content) {
      throw new Error('Content not found');
    }

    await Content.deleteOne({ key });

    await Activity.create({
      actor: new Types.ObjectId(adminId),
      actorType: ActivityActorType.ADMIN,
      action: 'delete_content',
      resource: 'content',
      details: { key },
    });
  }

  // ==================== PREDEFINED CONTENT KEYS ====================

  /**
   * Get privacy policy
   */
  static async getPrivacyPolicy(): Promise<string> {
    const content = await Content.findOne({ key: 'privacy_policy' });
    return content?.content || '';
  }

  /**
   * Set privacy policy
   */
  static async setPrivacyPolicy(content: string, adminId: string): Promise<void> {
    await this.setContent('privacy_policy', { content, type: 'html' }, adminId);
  }

  /**
   * Get terms of service
   */
  static async getTermsOfService(): Promise<string> {
    const content = await Content.findOne({ key: 'terms_of_service' });
    return content?.content || '';
  }

  /**
   * Set terms of service
   */
  static async setTermsOfService(content: string, adminId: string): Promise<void> {
    await this.setContent('terms_of_service', { content, type: 'html' }, adminId);
  }

  /**
   * Get about us
   */
  static async getAboutUs(): Promise<string> {
    const content = await Content.findOne({ key: 'about_us' });
    return content?.content || '';
  }

  /**
   * Set about us
   */
  static async setAboutUs(content: string, adminId: string): Promise<void> {
    await this.setContent('about_us', { content, type: 'html' }, adminId);
  }
}

export default CmsService;
