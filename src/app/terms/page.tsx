'use client';

import Link from 'next/link';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { ThemeProvider } from '@/components/public/ThemeProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import '@/app/(public)/globals-public.css';
import { FileText } from 'lucide-react';

export default function TermsPage() {
  const { settings } = useSiteSettings();
  const companyName = settings.siteName;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--public-bg)]">
        <Navbar />

        {/* Hero */}
        <section className="relative pt-32 pb-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--public-primary)]/20 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-[var(--public-primary)]" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">Terms of Service</h1>
            <p className="text-slate-400">Last updated: January 2024</p>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 bg-[var(--public-bg)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[var(--public-surface)] rounded-2xl border border-[var(--public-border)] p-8 md:p-12">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">1. Acceptance of Terms</h2>
                  <p className="text-[var(--public-text-secondary)]">
                    By accessing or using {companyName}&apos;s services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">2. Eligibility</h2>
                  <p className="text-[var(--public-text-secondary)]">
                    You must be at least 18 years old and a legal resident of the United States to open an account with {companyName}. By using our services, you represent that you meet these eligibility requirements.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">3. Account Responsibilities</h2>
                  <p className="text-[var(--public-text-secondary)] mb-4">You are responsible for:</p>
                  <ul className="list-disc pl-6 text-[var(--public-text-secondary)] space-y-2">
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any unauthorized use</li>
                    <li>Ensuring your contact information is accurate and up-to-date</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">4. Prohibited Activities</h2>
                  <p className="text-[var(--public-text-secondary)] mb-4">You agree not to:</p>
                  <ul className="list-disc pl-6 text-[var(--public-text-secondary)] space-y-2">
                    <li>Use our services for any illegal purpose</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Transmit viruses or malicious code</li>
                    <li>Engage in fraudulent activities</li>
                    <li>Violate any applicable laws or regulations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">5. Fees and Charges</h2>
                  <p className="text-[var(--public-text-secondary)]">
                    Certain services may be subject to fees. All applicable fees will be disclosed before you complete a transaction. We reserve the right to change our fee structure with prior notice.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">6. Limitation of Liability</h2>
                  <p className="text-[var(--public-text-secondary)]">
                    {companyName} shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services, except where prohibited by law.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">7. Modifications</h2>
                  <p className="text-[var(--public-text-secondary)]">
                    We reserve the right to modify these Terms of Service at any time. We will notify you of any material changes via email or through our website. Your continued use of our services constitutes acceptance of the modified terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-[var(--public-text-primary)] mb-4">8. Contact Information</h2>
                  <p className="text-[var(--public-text-secondary)]">
                    For questions about these Terms of Service, please contact us at{' '}
                    <a href={`mailto:${settings.siteEmail || 'legal@example.com'}`} className="text-[var(--public-primary)] hover:underline">
                      {settings.siteEmail || 'legal@example.com'}
                    </a>
                  </p>
                </section>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </ThemeProvider>
  );
}
