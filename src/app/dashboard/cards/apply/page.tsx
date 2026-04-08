'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CreditCard,
  ChevronRight,
  ArrowLeft,
  Info,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import toast from 'react-hot-toast';

// Card types available
const CARD_TYPES = [
  {
    id: 'visa',
    name: 'Visa',
    description: 'Accepted worldwide, suitable for most online purchases',
    logo: (
      <svg className="h-8 w-12" viewBox="0 0 1000 324" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M433.334 318.516H348.568L403.315 5.01855H488.081L433.334 318.516Z" fill="#1434CB"/>
        <path d="M727.98 15.9043C712.039 9.56622 686.227 2.51855 653.355 2.51855C574.054 2.51855 519.055 45.5277 518.802 106.826C518.306 152.343 558.126 177.912 587.98 193.316C618.34 209.233 629.315 219.335 629.315 233.014C629.061 254.008 603.493 263.591 579.702 263.591C547.839 263.591 530.7 258.287 505.123 245.892L493.902 240.335L482.166 313.221C501.069 323.07 536.096 331.667 572.643 332.163C657.14 332.163 711.128 289.897 711.895 224.144C712.394 188.508 689.871 160.445 643.015 136.91C615.2 121.744 598.306 111.638 598.554 97.2356C598.554 84.5987 613.224 70.9167 648.747 70.9167C677.823 70.4206 699.053 77.7188 715.707 85.5144L726.681 90.8186L738.417 19.9214L727.98 15.9043Z" fill="#1434CB"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M841.897 5.01855H773.691C755.782 5.01855 742.397 10.0624 734.862 30.0238L630.236 318.516H715.464C715.464 318.516 729.143 280.806 732.429 272.002C742.901 272.002 822.706 272.002 835.844 272.002C838.373 283.215 845.93 318.516 845.93 318.516H922.667L841.897 5.01855ZM762.22 208.49C769.018 189.752 796.85 116.686 796.85 116.686C796.602 117.174 803.16 99.19 806.699 88.0899L812.02 114.188C812.02 114.188 829.775 192.026 833.061 208.49H762.22Z" fill="#1434CB"/>
        <path d="M251.994 5.01855L171.471 219.335L162.137 174.313C146.216 129.054 102.175 80.0894 52.8662 56.8035L126.462 318.02H212.215L336.832 5.01855H251.994Z" fill="#1434CB"/>
        <path d="M127.963 5.01855H0.66211L0.167969 10.3101C98.1497 31.7971 163.301 76.5646 190.132 129.298L162.633 13.5747C157.329 -0.60098 144.316 5.51465 127.963 5.01855Z" fill="#1434CB"/>
      </svg>
    ),
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    description: 'Global acceptance with enhanced security features',
    logo: (
      <svg className="h-8 w-12" viewBox="0 0 131.39 86.9" xmlns="http://www.w3.org/2000/svg">
        <path d="M48.37 15.14h34.66v56.61H48.37z" fill="#ff5f00"/>
        <path d="M52.37 43.45a35.94 35.94 0 0113.75-28.3 36 36 0 100 56.61 35.94 35.94 0 01-13.75-28.31z" fill="#eb001b"/>
        <path d="M120.39 65.54V64.5h.48v-.24h-1.19v.24h.47v1.04zm2.31 0v-1.29h-.36l-.42.91-.42-.91h-.36v1.29h.26V64.9l.39.89h.27l.39-.89v.89z" fill="#f79e1b"/>
        <path d="M123.94 43.45a36 36 0 01-58 28.3 36 36 0 000-56.61 36 36 0 0158 28.3z" fill="#f79e1b"/>
      </svg>
    ),
  },
];

// Currency options
const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
];

export default function ApplyCardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSiteSettings();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cardType: 'visa',
    currency: 'USD',
    dailyLimit: 1000,
    cardholderName: user?.name || '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    termsAccepted: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('billingAddress.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [field]: value,
        },
      }));
    } else if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    if (!formData.billingAddress.street || !formData.billingAddress.city || 
        !formData.billingAddress.state || !formData.billingAddress.zipCode || 
        !formData.billingAddress.country) {
      toast.error('Please fill in all billing address fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to continue');
        return;
      }

      const response = await fetch('/api/user/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardType: formData.cardType,
          cardholderName: formData.cardholderName || user?.name,
          billingAddress: formData.billingAddress,
          dailyLimit: formData.dailyLimit,
          currency: formData.currency,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Card application submitted successfully!');
        router.push('/dashboard/cards');
      } else {
        toast.error(data.message || 'Failed to submit card application');
      }
    } catch (error) {
      console.error('Card application error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
      {/* Breadcrumbs + Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center text-sm">
              <Link href="/dashboard" className="text-gray-500 hover:text-blue-400">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
              <Link href="/dashboard/cards" className="text-gray-500 hover:text-blue-400">
                Cards
              </Link>
              <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
              <span className="text-gray-300">Apply</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-2" style={{color: "white"}}>Apply for Virtual Card</h1>
          </div>
          <Link
            href="/dashboard/cards"
            className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cards
          </Link>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
        {/* Card Info Banner */}
        <div className="bg-gradient-to-r from-[#004B87] to-blue-700 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white" style={{color: "white"}}>Apply for a Virtual Card</h2>
              <p className="text-gray-200 mt-1">
                Get instant access to a virtual card for online payments and subscriptions
              </p>
            </div>
            <div className="hidden md:block">
              <CreditCard className="h-16 w-16 text-white/50" />
            </div>
          </div>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Card Details Section */}
          <section>
            <h3 className="text-lg font-medium text-white mb-4" style={{color: "white"}}>Card Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card Type */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Card Type <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3">
                  {CARD_TYPES.map((type) => (
                    <label
                      key={type.id}
                      className={`relative flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                        formData.cardType === type.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cardType"
                        value={type.id}
                        checked={formData.cardType === type.id}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <div
                            className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                              formData.cardType === type.id
                                ? 'border-blue-500'
                                : 'border-gray-500'
                            }`}
                          >
                            {formData.cardType === type.id && (
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">{type.name}</p>
                            <p className="text-sm text-gray-400">{type.description}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">{type.logo}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-300 mb-1">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {CURRENCIES.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Daily Limit */}
              <div>
                <label htmlFor="dailyLimit" className="block text-sm font-medium text-gray-300 mb-1">
                  Daily Spending Limit
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="dailyLimit"
                    name="dailyLimit"
                    min={100}
                    max={50000}
                    value={formData.dailyLimit}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-16 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">USD</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Limits: $100 - $50,000</p>
              </div>
            </div>
          </section>

          {/* Billing Information Section */}
          <section>
            <h3 className="text-lg font-medium text-white mb-4" style={{color: "white"}}>Billing Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cardholder Name */}
              <div className="md:col-span-2">
                <label htmlFor="cardholderName" className="block text-sm font-medium text-gray-300 mb-1">
                  Cardholder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="cardholderName"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleInputChange}
                  placeholder="Name as it will appear on your card"
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Street Address */}
              <div className="md:col-span-2">
                <label htmlFor="billingAddress.street" className="block text-sm font-medium text-gray-300 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="billingAddress.street"
                  name="billingAddress.street"
                  value={formData.billingAddress.street}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="billingAddress.city" className="block text-sm font-medium text-gray-300 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="billingAddress.city"
                  name="billingAddress.city"
                  value={formData.billingAddress.city}
                  onChange={handleInputChange}
                  placeholder="New York"
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* State */}
              <div>
                <label htmlFor="billingAddress.state" className="block text-sm font-medium text-gray-300 mb-1">
                  State/Province <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="billingAddress.state"
                  name="billingAddress.state"
                  value={formData.billingAddress.state}
                  onChange={handleInputChange}
                  placeholder="NY"
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Zip Code */}
              <div>
                <label htmlFor="billingAddress.zipCode" className="block text-sm font-medium text-gray-300 mb-1">
                  Zip/Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="billingAddress.zipCode"
                  name="billingAddress.zipCode"
                  value={formData.billingAddress.zipCode}
                  onChange={handleInputChange}
                  placeholder="10001"
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Country */}
              <div>
                <label htmlFor="billingAddress.country" className="block text-sm font-medium text-gray-300 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="billingAddress.country"
                  name="billingAddress.country"
                  value={formData.billingAddress.country}
                  onChange={handleInputChange}
                  placeholder="United States"
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex">
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-white" style={{color: "white"}}>Card Application</h3>
                <div className="mt-2 text-sm text-gray-300">
                  <p>
                    Your virtual card application will be reviewed by our team. Once approved, you
                    will receive a notification and your card will be ready to use for online
                    transactions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="border-t border-gray-800 pt-6">
            <label className="flex items-start cursor-pointer">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span className="ml-3 text-sm text-gray-300">
                I agree to the{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">
                  Card Agreement
                </a>
                . I understand that my application will be reviewed and I will be notified of the
                decision.
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply for Card
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* FAQs Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-4" style={{color: "white"}}>Frequently Asked Questions</h2>

        <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden divide-y divide-gray-800">
          <div className="p-6">
            <h3 className="text-lg font-medium text-white" style={{color: "white"}}>How soon will my virtual card be ready?</h3>
            <p className="mt-2 text-gray-400">
              Virtual cards are typically issued within minutes after approval. You&apos;ll receive a
              notification when your card is ready to use.
            </p>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-medium text-white" style={{color: "white"}}>
              Can I use my virtual card for all online purchases?
            </h3>
            <p className="mt-2 text-gray-400">
              Yes, your virtual card works for most online merchants that accept Visa or Mastercard.
              However, some merchants may require a physical card for verification purposes.
            </p>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-medium text-white" style={{color: "white"}}>How do I fund my virtual card?</h3>
            <p className="mt-2 text-gray-400">
              Your virtual card is linked to your account balance. Funds are automatically drawn from
              your main balance when making purchases. You can also request a top-up from your
              dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
