'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { ThemeProvider } from '@/components/public/ThemeProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import '@/app/(public)/globals-public.css';
import {
  Phone, Mail, MapPin, Clock, MessageCircle, Send, Loader2,
  Building2, Headphones, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const contactMethods = [
  { icon: Phone, title: 'Call Us', description: '+1 (800) 123-4567', subtitle: 'Mon-Fri 9AM-6PM EST' },
  { icon: MapPin, title: 'Visit Us', description: '123 Financial District', subtitle: 'New York, NY 10004' },
  { icon: Mail, title: 'Mail Us', description: 'support@example.com', subtitle: 'We reply within 24 hours' },
  { icon: Headphones, title: 'Live Chat', description: 'Chat with Us', subtitle: 'Available 24/7' },
];

export default function ContactPage() {
  const { settings } = useSiteSettings();
  const companyName = settings.siteName;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Your message has been sent successfully!');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--public-bg)]">
        <Navbar />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 bg-[url('/images/hero.jpg')] bg-cover bg-center opacity-20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">Contact Us</h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Send us a message and we&apos;ll get back to you
            </p>
            <div className="flex items-center justify-center gap-2 mt-6 text-slate-400">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white">Contact</span>
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-20 bg-[var(--public-bg)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Form */}
              <div className="bg-[var(--public-surface)] rounded-2xl p-8 border border-[var(--public-border)] shadow-sm">
                <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-2">Ready to get started?</h2>
                <p className="text-[var(--public-text-secondary)] mb-8">Fill out the form below and we&apos;ll get back to you shortly.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[var(--public-text-primary)] mb-2">
                      Your Name <span className="text-[var(--public-error)]">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 border border-[var(--public-border)] rounded-xl bg-[var(--public-bg)] text-[var(--public-text-primary)] placeholder-[var(--public-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--public-primary)] transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--public-text-primary)] mb-2">
                      Email Address <span className="text-[var(--public-error)]">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="w-full px-4 py-3 border border-[var(--public-border)] rounded-xl bg-[var(--public-bg)] text-[var(--public-text-primary)] placeholder-[var(--public-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--public-primary)] transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--public-text-primary)] mb-2">
                      Subject <span className="text-[var(--public-error)]">*</span>
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Enter subject"
                      className="w-full px-4 py-3 border border-[var(--public-border)] rounded-xl bg-[var(--public-bg)] text-[var(--public-text-primary)] placeholder-[var(--public-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--public-primary)] transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--public-text-primary)] mb-2">
                      Message <span className="text-[var(--public-error)]">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder="Enter your message"
                      className="w-full px-4 py-3 border border-[var(--public-border)] rounded-xl bg-[var(--public-bg)] text-[var(--public-text-primary)] placeholder-[var(--public-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--public-primary)] transition-all resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-[var(--public-primary)] text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Sending...</>
                    ) : (
                      <><Send className="w-5 h-5 mr-2" /> Send Message</>
                    )}
                  </button>
                </form>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">
                  Looking for an easy and secured place to save your money?
                </h3>
                <p className="text-lg text-[var(--public-text-secondary)] mb-6">
                  Search no more! Click on the button below to get started.
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center px-6 py-3 border-2 border-[var(--public-primary)] text-[var(--public-primary)] font-semibold rounded-xl hover:bg-[var(--public-primary)] hover:text-white transition-all mb-8"
                >
                  Get Your Solution <ArrowRight className="w-5 h-5 ml-2" />
                </Link>

                <hr className="border-[var(--public-border)] my-8" />

                <h4 className="text-lg font-semibold text-[var(--public-text-primary)] mb-4">Our Headquarters</h4>
                <address className="text-[var(--public-text-secondary)] not-italic mb-6">
                  123 Financial District<br />
                  New York, NY 10004<br />
                  United States
                </address>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[var(--public-text-secondary)]">
                    <Phone className="w-5 h-5 text-[var(--public-primary)]" />
                    <span>+1 (800) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-3 text-[var(--public-text-secondary)]">
                    <Mail className="w-5 h-5 text-[var(--public-primary)]" />
                    <span>{settings.siteEmail || 'support@example.com'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[var(--public-text-secondary)]">
                    <Clock className="w-5 h-5 text-[var(--public-primary)]" />
                    <span>Mon - Fri: 9AM - 6PM EST</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16 bg-[var(--public-surface)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactMethods.map((method, index) => (
                <div
                  key={index}
                  className="bg-[var(--public-bg)] rounded-2xl p-6 text-center border border-[var(--public-border)] hover:shadow-lg transition-shadow"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[var(--public-primary-soft)] flex items-center justify-center mx-auto mb-4">
                    <method.icon className="w-7 h-7 text-[var(--public-primary)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--public-text-primary)] mb-1">{method.title}</h3>
                  <p className="text-[var(--public-text-primary)] font-medium">{method.description}</p>
                  <p className="text-sm text-[var(--public-text-secondary)]">{method.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Map Section (Placeholder) */}
        <section className="h-96 bg-slate-800 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-[var(--public-primary)] mx-auto mb-4" />
              <p className="text-white text-lg font-medium">123 Financial District, New York</p>
              <p className="text-slate-400">Interactive map coming soon</p>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </ThemeProvider>
  );
}
