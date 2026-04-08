'use client';

import Link from 'next/link';
import { Navbar } from '@/components/public/Navbar';
import { Footer } from '@/components/public/Footer';
import { ThemeProvider } from '@/components/public/ThemeProvider';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import '@/app/(public)/globals-public.css';
import {
  CreditCard, Shield, Gift, Plane, ShoppingBag, CheckCircle2,
  ArrowRight, Users, Percent, Star,
} from 'lucide-react';

const cards = [
  {
    name: 'Everyday Rewards',
    color: 'from-blue-500 to-indigo-600',
    apr: '14.99%',
    rewards: '1.5%',
    features: ['1.5% cash back on all purchases', 'No annual fee', 'Free credit score monitoring', '0% intro APR for 15 months'],
  },
  {
    name: 'Travel Elite',
    color: 'from-purple-500 to-pink-600',
    apr: '17.99%',
    rewards: '3x',
    features: ['3x points on travel & dining', 'Airport lounge access', 'No foreign transaction fees', 'Travel insurance included'],
  },
  {
    name: 'Business Pro',
    color: 'from-emerald-500 to-teal-600',
    apr: '15.99%',
    rewards: '2%',
    features: ['2% cash back on business expenses', 'Employee cards at no cost', 'Expense management tools', 'Higher credit limits'],
  },
];

const benefits = [
  { icon: Shield, title: 'Fraud Protection', description: 'Zero liability on unauthorized purchases' },
  { icon: Gift, title: 'Welcome Bonus', description: 'Earn bonus points after first purchase' },
  { icon: Plane, title: 'Travel Perks', description: 'Exclusive travel benefits and insurance' },
  { icon: ShoppingBag, title: 'Shopping Rewards', description: 'Extra rewards at partner merchants' },
];

export default function CardsPage() {
  const { settings } = useSiteSettings();
  const companyName = settings.siteName;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[var(--public-bg)]">
        <Navbar />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 bg-gradient-to-br from-indigo-900 via-purple-800 to-slate-900">
          <div className="absolute inset-0 bg-[url('/images/hero.jpg')] bg-cover bg-center opacity-10" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400 text-sm font-medium mb-6">
              <CreditCard className="w-4 h-4" />
              Credit Cards
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Find Your Perfect Card
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
              Discover credit cards with rewards, low rates, and benefits designed for your lifestyle.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 transition-all"
            >
              <Users className="w-5 h-5 mr-2" />
              Apply Now
            </Link>
          </div>
        </section>

        {/* Cards Section */}
        <section className="py-20 bg-[var(--public-bg)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--public-text-primary)] mb-4">
                Choose Your Card
              </h2>
              <p className="text-lg text-[var(--public-text-secondary)]">
                Cards designed to match your spending habits and goals.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {cards.map((card, index) => (
                <div
                  key={index}
                  className="bg-[var(--public-surface)] rounded-2xl overflow-hidden border border-[var(--public-border)] hover:shadow-xl transition-shadow"
                >
                  <div className={`h-48 bg-gradient-to-br ${card.color} p-6 flex flex-col justify-between`}>
                    <div className="flex justify-between items-start">
                      <CreditCard className="w-10 h-10 text-white/80" />
                      <Star className="w-6 h-6 text-white/80" />
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">Credit Card</p>
                      <p className="text-white text-xl font-bold">{card.name}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between mb-6">
                      <div>
                        <p className="text-[var(--public-text-secondary)] text-sm">APR</p>
                        <p className="text-[var(--public-text-primary)] font-semibold">{card.apr}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--public-text-secondary)] text-sm">Rewards</p>
                        <p className="text-[var(--public-text-primary)] font-semibold">{card.rewards}</p>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {card.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[var(--public-text-secondary)]">
                          <CheckCircle2 className="w-4 h-4 text-[var(--public-primary)] shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/register"
                      className="block w-full py-3 text-center bg-[var(--public-primary)] text-white font-semibold rounded-xl hover:opacity-90 transition-all"
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-[var(--public-surface)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--public-text-primary)] mb-4">
                Card Benefits
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--public-primary-soft)] flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-8 h-8 text-[var(--public-primary)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--public-text-primary)] mb-2">{benefit.title}</h3>
                  <p className="text-[var(--public-text-secondary)]">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Start Earning Rewards Today
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              Apply for a {companyName} credit card and unlock exclusive benefits.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all"
            >
              Apply Now <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </ThemeProvider>
  );
}
