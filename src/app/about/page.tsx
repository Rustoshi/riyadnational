'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { ThemeProvider } from '@/components/public/ThemeProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import '@/app/(public)/globals-public.css';
import {
  Shield, LifeBuoy, Lock, Building2, Headphones, Wallet,
  Globe, CreditCard, Key, Users, Target, Eye, CheckCircle2,
  Award, TrendingUp, Clock,
} from 'lucide-react';

const features = [
  { icon: LifeBuoy, title: 'Stable Banking', description: 'We provide services void of errors and irregularities while maintaining consistency in quality of service.' },
  { icon: Shield, title: 'Reliable System', description: 'Our system has been made reliable by making our services available and accessible anytime from anywhere.' },
  { icon: Lock, title: 'Fully Secured', description: 'We use updated and sophisticated fintech technologies to secure and ensure safe transactions for all users.' },
  { icon: Building2, title: 'Loan Services', description: 'We offer different kinds of loans including Student Loans, Business Banking and more.' },
  { icon: Headphones, title: 'Reliable Customer Service', description: 'Get help in seconds. Contact Customer Support. We\'re available to help you 24 hours a day, 7 days a week.' },
  { icon: Wallet, title: 'Personal Savings', description: 'Savings account that gives you a safe place to store your money and often earns compounding interest.' },
];

const whyUsFeatures = [
  { icon: CreditCard, title: 'Multiple Payment Options', description: 'We support multiple payment methods: Visa, MasterCard, bank transfer, cryptocurrency and lots more.' },
  { icon: Globe, title: 'World Coverage', description: 'We provide services in 80% countries around all the globe located in various continents.' },
  { icon: TrendingUp, title: 'Incredible Transaction Fee', description: 'Our transaction fees and rates are incredibly low for all customers and all market makers.' },
  { icon: Key, title: 'Secured Transactions', description: 'Your finance is secured with our advanced technologies that protect you against digital thefts and hacks.' },
  { icon: Lock, title: 'Strong Security', description: 'We offer you an unbeatable protection against DDoS attacks with full data encryption for all your transactions.' },
  { icon: Headphones, title: '24/7 Support', description: 'Our customer care service is available at all time to attend to you and also offer solutions to all your needs.' },
];

const stats = [
  { value: '2012', label: 'Founded' },
  { value: '2M+', label: 'Customers' },
  { value: '80+', label: 'Countries' },
  { value: '99.9%', label: 'Uptime' },
];

export default function AboutPage() {
  const { settings } = useSiteSettings();
  const companyName = settings.siteName;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--public-bg)]">
        <Navbar />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute inset-0 bg-[url('/images/hero.jpg')] bg-cover bg-center opacity-20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">About Us</h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Building financial strength together since 2012
            </p>
            <div className="flex items-center justify-center gap-2 mt-6 text-slate-400">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white">About Us</span>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-[var(--public-bg)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-[var(--public-surface)] rounded-2xl p-6 border border-[var(--public-border)] hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--public-primary-soft)] flex items-center justify-center shrink-0">
                      <feature.icon className="w-6 h-6 text-[var(--public-primary)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--public-text-primary)] mb-2">{feature.title}</h3>
                      <p className="text-[var(--public-text-secondary)] text-sm">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Content */}
        <section className="py-20 bg-[var(--public-surface)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--public-primary)] to-indigo-600 rounded-3xl blur-2xl opacity-20" />
                <Image
                  src="/images/team-meeting.jpg"
                  alt="About Us"
                  width={600}
                  height={450}
                  className="relative rounded-3xl shadow-xl w-full h-auto object-cover"
                />
              </div>
              <div>
                <span className="inline-block px-4 py-1.5 bg-[var(--public-primary-soft)] text-[var(--public-primary)] text-sm font-medium rounded-full mb-4">
                  Our Story
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--public-text-primary)] mb-6">
                  About {companyName}
                </h2>
                <div className="space-y-4 text-[var(--public-text-secondary)]">
                  <p>
                    A few years ago, a small team of people determined to transform banking launched a savings app for everyone. 
                    That app was the first step toward {companyName}.
                  </p>
                  <p>
                    Today, we&apos;re even more determined and we&apos;ve built a Central Bank-licensed, microfinance bank to help you 
                    get the best out of your money without overcharging you.
                  </p>
                  <p>
                    {companyName} includes tools for tracking your spending habits, saving more and making the right money moves. 
                    So no matter who you are or where you live, we&apos;re here because of you.
                  </p>
                </div>

                {/* Mission & Vision Tabs */}
                <div className="mt-8 grid sm:grid-cols-2 gap-6">
                  <div className="bg-[var(--public-bg)] rounded-xl p-5 border border-[var(--public-border)]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--public-primary-soft)] flex items-center justify-center">
                        <Target className="w-5 h-5 text-[var(--public-primary)]" />
                      </div>
                      <h3 className="font-semibold text-[var(--public-text-primary)]">Our Mission</h3>
                    </div>
                    <p className="text-sm text-[var(--public-text-secondary)]">
                      To provide our users a unique, safe and secured platform for transactions in the field of finance and fintech.
                    </p>
                  </div>
                  <div className="bg-[var(--public-bg)] rounded-xl p-5 border border-[var(--public-border)]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--public-primary-soft)] flex items-center justify-center">
                        <Eye className="w-5 h-5 text-[var(--public-primary)]" />
                      </div>
                      <h3 className="font-semibold text-[var(--public-text-primary)]">Our Vision</h3>
                    </div>
                    <p className="text-sm text-[var(--public-text-secondary)]">
                      To widen our customer reach to people of different races, countries and continents worldwide.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* History Section */}
        <section className="py-20 bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-slate-800 text-[var(--public-primary)] text-sm font-medium rounded-full mb-4">
                Our Journey
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">A Brief History About Us</h2>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6 text-slate-300">
                <p>
                  Our company, &quot;{companyName}&quot;, was founded in 2012 by a group of socially-minded entrepreneurs who saw the need 
                  for accessible financial services for low-income individuals and small businesses. They believed that by providing 
                  small loans and other financial services to these underbanked populations, they could help to promote economic growth 
                  and reduce poverty in their community.
                </p>
                <p>
                  In the early days, {companyName} focused on providing small loans to micro-entrepreneurs in their local area. 
                  They quickly realized that there was a high demand for their services and decided to expand their operations 
                  by opening new branches in other cities.
                </p>
                <p>
                  As the company grew, they started to offer a wider range of financial services, such as savings accounts, 
                  insurance, and money transfers. They also began to develop innovative new products, such as mobile banking 
                  services, to make it easier for their customers to access their services.
                </p>
                <p>
                  Throughout its history, {companyName} has always been guided by its mission to empower the underbanked and 
                  promote economic growth. The company&apos;s impact can be seen in the many small businesses that have been able 
                  to grow and create jobs as a result of their services.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-[var(--public-primary)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl sm:text-5xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-white/80">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Us Section */}
        <section className="py-20 bg-[var(--public-bg)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 bg-[var(--public-primary-soft)] text-[var(--public-primary)] text-sm font-medium rounded-full mb-4">
                Why Choose Us
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--public-text-primary)] mb-4">Why Us?</h2>
              <p className="text-lg text-[var(--public-text-secondary)] max-w-2xl mx-auto">
                Here are some of the many features that define our uniqueness.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {whyUsFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="bg-[var(--public-surface)] rounded-2xl p-6 text-center border border-[var(--public-border)] hover:shadow-lg transition-shadow"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[var(--public-primary-soft)] flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-[var(--public-primary)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--public-text-primary)] mb-2">{feature.title}</h3>
                  <p className="text-[var(--public-text-secondary)] text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[var(--public-surface)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--public-text-primary)] mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-[var(--public-text-secondary)] mb-8">
              Join thousands of satisfied customers who trust {companyName} with their finances.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-[var(--public-primary)] text-white font-semibold rounded-xl hover:opacity-90 transition-all"
              >
                <Users className="w-5 h-5 mr-2" />
                Open Account
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-[var(--public-border)] text-[var(--public-text-primary)] font-semibold rounded-xl hover:bg-[var(--public-bg)] transition-all"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </ThemeProvider>
  );
}
