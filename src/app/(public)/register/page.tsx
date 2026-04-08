'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  Globe,
  Landmark,
  Shield,
  Eye,
  EyeOff,
  ChevronRight,
  Check,
  CheckCircle2,
  Circle,
  CreditCard,
  PiggyBank,
  Briefcase,
  Key,
  Loader2,
  Lock,
  Zap,
  Clock,
  Globe2,
  AtSign,
  Coins,
  TrendingUp,
  Vault,
} from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { AccountType } from '@/types';

// Countries list
const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
  'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei',
  'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
  'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
  'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India',
  'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
  'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives',
  'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia',
  'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
  'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
  'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka',
  'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand',
  'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
  'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

const accountTypes = [
  { value: AccountType.SAVINGS, label: 'Savings Account', description: 'Earn interest on your deposits', icon: PiggyBank },
  { value: AccountType.CURRENT, label: 'Current Account', description: 'For frequent transactions', icon: CreditCard },
  { value: AccountType.CHECKING, label: 'Checking Account', description: 'Perfect for daily transactions', icon: CreditCard },
  { value: AccountType.DOMICILLARY, label: 'Domicillary Account', description: 'Hold foreign currencies', icon: Globe },
  { value: AccountType.OFFSHORE, label: 'Offshore Account', description: 'International banking services', icon: Globe2 },
  { value: AccountType.OFFSHORE_INVESTMENT, label: 'Offshore Investment', description: 'International investment options', icon: TrendingUp },
  { value: AccountType.ESCROW, label: 'Escrow Account', description: 'Secure fund holding', icon: Shield },
  { value: AccountType.FIXED_DEPOSIT, label: 'Fixed Deposit', description: 'Higher returns on term deposits', icon: Vault },
];

// Comprehensive list of world currencies
const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب' },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د' },
  { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س.' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼' },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭' },
  { code: 'BND', name: 'Brunei Dollar', symbol: 'B$' },
  { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'лв' },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼' },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br' },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'L' },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L' },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин.' },
  { code: 'BAM', name: 'Bosnia-Herzegovina Mark', symbol: 'KM' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr' },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$' },
  { code: 'TTD', name: 'Trinidad Dollar', symbol: 'TT$' },
  { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$' },
  { code: 'BSD', name: 'Bahamian Dollar', symbol: 'B$' },
  { code: 'BZD', name: 'Belize Dollar', symbol: 'BZ$' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q' },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L' },
  { code: 'NIO', name: 'Nicaraguan Cordoba', symbol: 'C$' },
  { code: 'CRC', name: 'Costa Rican Colon', symbol: '₡' },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.' },
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$' },
  { code: 'CUP', name: 'Cuban Peso', symbol: '₱' },
  { code: 'HTG', name: 'Haitian Gourde', symbol: 'G' },
  { code: 'PYG', name: 'Paraguayan Guarani', symbol: '₲' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U' },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs.' },
  { code: 'VES', name: 'Venezuelan Bolivar', symbol: 'Bs.' },
  { code: 'GYD', name: 'Guyanese Dollar', symbol: 'G$' },
  { code: 'SRD', name: 'Surinamese Dollar', symbol: 'Sr$' },
  { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$' },
  { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K' },
  { code: 'WST', name: 'Samoan Tala', symbol: 'WS$' },
  { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$' },
  { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT' },
  { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$' },
  { code: 'XCD', name: 'East Caribbean Dollar', symbol: 'EC$' },
  { code: 'AWG', name: 'Aruban Florin', symbol: 'ƒ' },
  { code: 'ANG', name: 'Netherlands Antillean Guilder', symbol: 'ƒ' },
  { code: 'KYD', name: 'Cayman Islands Dollar', symbol: 'CI$' },
  { code: 'BMD', name: 'Bermudian Dollar', symbol: 'BD$' },
  { code: 'XPF', name: 'CFP Franc', symbol: '₣' },
  { code: 'SCR', name: 'Seychellois Rupee', symbol: '₨' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf' },
  { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.' },
  { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$' },
];

const features = [
  { icon: Lock, title: 'Secure Platform', description: 'Bank-grade security' },
  { icon: Zap, title: 'Fast Transfers', description: 'Instant payments' },
  { icon: Clock, title: '24/7 Access', description: 'Always available' },
  { icon: Globe2, title: 'Global Banking', description: 'Worldwide access' },
];

const steps = [
  { id: 1, label: 'Personal', icon: User },
  { id: 2, label: 'Contact', icon: Mail },
  { id: 3, label: 'Account', icon: Landmark },
  { id: 4, label: 'Security', icon: Shield },
];

interface FormData {
  name: string;
  middleName: string;
  lastName: string;

  email: string;
  phone: string;
  country: string;
  currency: string;
  accountType: AccountType;
  pin: string;
  password: string;
  passwordConfirmation: string;
  terms: boolean;
  referralCode: string;
}

const initialFormData: FormData = {
  name: '',
  middleName: '',
  lastName: '',

  email: '',
  phone: '',
  country: '',
  currency: 'USD',
  accountType: AccountType.SAVINGS,
  pin: '',
  password: '',
  passwordConfirmation: '',
  terms: false,
  referralCode: '',
};

export default function RegisterPage() {
  const router = useRouter();
  const { settings } = useSiteSettings();
  const companyName = settings.siteName;

  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [apiError, setApiError] = useState('');

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';

    }

    if (currentStep === 2) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email address';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.country) newErrors.country = 'Country is required';
    }

    if (currentStep === 3) {
      if (!formData.accountType) newErrors.accountType = 'Account type is required';
      if (!formData.currency) newErrors.currency = 'Currency is required';
      if (!formData.pin) {
        newErrors.pin = 'PIN is required';
      } else if (!/^\d{4}$/.test(formData.pin)) {
        newErrors.pin = 'PIN must be 4 digits';
      }
    }

    if (currentStep === 4) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/[a-z]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one lowercase letter';
      } else if (!/[A-Z]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one number';
      }
      if (formData.password !== formData.passwordConfirmation) {
        newErrors.passwordConfirmation = 'Passwords do not match';
      }
      if (!formData.terms) {
        newErrors.terms = 'You must accept the terms and conditions';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkAvailability = async (): Promise<boolean> => {
    setIsCheckingAvailability(true);
    try {
      const checkData: { email?: string } = {};

      // Check email on step 2
      if (step === 2 && formData.email) {
        checkData.email = formData.email;
      }

      if (Object.keys(checkData).length === 0) {
        return true;
      }

      const response = await fetch('/api/auth/check-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkData),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError('Failed to check availability');
        return false;
      }

      const newErrors: Partial<Record<keyof FormData, string>> = {};

      if (data.data?.emailAvailable === false) {
        newErrors.email = 'This email is already registered';
      }



      if (Object.keys(newErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...newErrors }));
        return false;
      }

      return true;
    } catch (error) {
      console.error('Availability check error:', error);
      setApiError('Failed to check availability');
      return false;
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const nextStep = async () => {
    if (!validateStep(step)) return;

    // Check availability for step 2 (email)
    if (step === 2) {
      const isAvailable = await checkAvailability();
      if (!isAvailable) return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          middleName: formData.middleName || undefined,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          currency: formData.currency,
          accountType: formData.accountType,
          pin: formData.pin,
          password: formData.password,
          referralCode: formData.referralCode || undefined,
          terms: formData.terms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }



      router.push('/pending-approval');
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = () => {
    let score = 0;
    const password = formData.password;
    if (password.length > 7) score += 1;
    if (password.length > 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-900">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-700 relative overflow-hidden flex-col justify-center items-center p-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Animated Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-float-slower" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-teal-400/25 rounded-full blur-3xl animate-float-reverse" />

        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Landmark className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <span className="text-2xl font-bold text-white">{companyName}</span>
              <span className="block text-sm text-blue-300 font-medium">Bank</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white mb-3" style={{ color: 'white' }}>Join {companyName}</h1>
          <h2 className="text-xl text-white mb-4 font-medium" style={{ color: 'white' }}>Create Your Banking Account</h2>

          {/* Description */}
          <p className="text-white text-base mb-10 leading-relaxed">
            Start your financial journey with {companyName}. Secure, fast, and reliable banking at your fingertips.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-600/60 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3 border border-slate-500/40 hover:bg-slate-600/80 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-blue-300" />
                </div>
                <div className="text-left">
                  <p className="text-white text-sm font-semibold">{feature.title}</p>
                  <p className="text-white not-only:text-xs">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-12 min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Landmark className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <span className="text-xl font-bold text-white">{companyName}</span>
                <span className="block text-xs text-blue-300 font-medium">Bank</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Join {companyName}</h1>
            <p className="text-white not-only:text-sm">Create your banking account</p>
          </div>

          {/* API Error */}
          {apiError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 mb-6 rounded-xl text-sm">
              {apiError}
            </div>
          )}

          {/* Form Card */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white" style={{ color: 'white' }}>Create Account</h2>
                <span className="text-sm text-white/70">Step {step} of {totalSteps}</span>
              </div>

              {/* Step Indicators */}
              <div className="flex justify-between">
                {steps.map((s) => (
                  <div key={s.id} className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all ${step >= s.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-600 text-white/70'
                        }`}
                    >
                      {step > s.id ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <s.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs ${step >= s.id ? 'text-blue-400' : 'text-white/50'}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6">
              {/* Step Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  {step === 1 && <User className="w-6 h-6 text-blue-400" />}
                  {step === 2 && <Mail className="w-6 h-6 text-blue-400" />}
                  {step === 3 && <Landmark className="w-6 h-6 text-blue-400" />}
                  {step === 4 && <Shield className="w-6 h-6 text-blue-400" />}
                </div>
                <h3 className="text-white font-medium" style={{ color: 'white' }}>
                  {step === 1 && 'Personal Information'}
                  {step === 2 && 'Contact Details'}
                  {step === 3 && 'Account Setup'}
                  {step === 4 && 'Security'}
                </h3>
                <p className="text-white text-sm mt-1">
                  {step === 1 && 'Tell us about yourself'}
                  {step === 2 && 'How can we reach you?'}
                  {step === 3 && 'Choose your account type'}
                  {step === 4 && 'Secure your account'}
                </p>
              </div>

              {/* Step 1: Personal Information */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white mb-2">First Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-slate-600'}`}
                        placeholder="John"
                      />
                    </div>
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-white mb-2">Last Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => updateFormData('lastName', e.target.value)}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.lastName ? 'border-red-500' : 'border-slate-600'}`}
                        placeholder="Smith"
                      />
                    </div>
                    {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-white mb-2">Middle Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        value={formData.middleName}
                        onChange={(e) => updateFormData('middleName', e.target.value)}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="David"
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* Step 2: Contact Information */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-slate-600'}`}
                        placeholder="john@example.com"
                      />
                    </div>
                    {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-white mb-2">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.phone ? 'border-red-500' : 'border-slate-600'}`}
                        placeholder="+1 (234) 567-8901"
                      />
                    </div>
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-white mb-2">Country *</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <select
                        value={formData.country}
                        onChange={(e) => updateFormData('country', e.target.value)}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${errors.country ? 'border-red-500' : 'border-slate-600'} ${!formData.country ? 'text-slate-500' : ''}`}
                      >
                        <option value="" disabled>Select your country</option>
                        {countries.map((country) => (
                          <option key={country} value={country} className="bg-slate-800">{country}</option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 rotate-90" />
                    </div>
                    {errors.country && <p className="text-red-400 text-xs mt-1">{errors.country}</p>}
                  </div>
                </div>
              )}

              {/* Step 3: Account Setup */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white mb-2">Account Type *</label>
                    <div className="relative">
                      <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <select
                        value={formData.accountType}
                        onChange={(e) => updateFormData('accountType', e.target.value)}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${errors.accountType ? 'border-red-500' : 'border-slate-600'}`}
                      >
                        {accountTypes.map((type) => (
                          <option key={type.value} value={type.value} className="bg-slate-800">
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 rotate-90" />
                    </div>
                    {errors.accountType && <p className="text-red-400 text-xs mt-1">{errors.accountType}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-white mb-2">Preferred Currency *</label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <select
                        value={formData.currency}
                        onChange={(e) => updateFormData('currency', e.target.value)}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none ${errors.currency ? 'border-red-500' : 'border-slate-600'}`}
                      >
                        {currencies.map((currency) => (
                          <option key={currency.code} value={currency.code} className="bg-slate-800">
                            {currency.code} - {currency.name} ({currency.symbol})
                          </option>
                        ))}
                      </select>
                      <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 rotate-90" />
                    </div>
                    <p className="text-white/60 text-xs mt-1">This will be your default account currency</p>
                    {errors.currency && <p className="text-red-400 text-xs mt-1">{errors.currency}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-white mb-2">Transaction PIN (4 digits) *</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type={showPin ? 'text' : 'password'}
                        value={formData.pin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                          updateFormData('pin', value);
                        }}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.pin ? 'border-red-500' : 'border-slate-600'}`}
                        placeholder="••••"
                        maxLength={4}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-white/60 text-xs mt-1">Your PIN will be required to authorize transactions</p>
                    {errors.pin && <p className="text-red-400 text-xs mt-1">{errors.pin}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-white mb-2">Referral Code (Optional)</label>
                    <input
                      type="text"
                      value={formData.referralCode}
                      onChange={(e) => updateFormData('referralCode', e.target.value.toUpperCase())}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter referral code"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Security */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white mb-2">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-10 pr-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? 'border-red-500' : 'border-slate-600'}`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}

                    {/* Password Strength */}
                    {formData.password && (
                      <div className="mt-3">
                        <div className="flex gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full ${i < getPasswordStrength()
                                ? getPasswordStrength() < 2 ? 'bg-red-500' : getPasswordStrength() < 4 ? 'bg-yellow-500' : 'bg-green-500'
                                : 'bg-slate-600'
                                }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${getPasswordStrength() < 2 ? 'text-red-400' : getPasswordStrength() < 4 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {strengthLabels[getPasswordStrength()]}
                        </p>
                        <ul className="mt-2 space-y-1 text-xs">
                          <li className={`flex items-center gap-1 ${formData.password.length > 7 ? 'text-green-400' : 'text-white/60'}`}>
                            {formData.password.length > 7 ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                            At least 8 characters
                          </li>
                          <li className={`flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? 'text-green-400' : 'text-white/60'}`}>
                            {/[A-Z]/.test(formData.password) ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                            One uppercase letter
                          </li>
                          <li className={`flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-green-400' : 'text-white/60'}`}>
                            {/[0-9]/.test(formData.password) ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                            One number
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-white mb-2">Confirm Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.passwordConfirmation}
                        onChange={(e) => updateFormData('passwordConfirmation', e.target.value)}
                        className={`w-full bg-slate-700/50 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.passwordConfirmation ? 'border-red-500' : 'border-slate-600'}`}
                        placeholder="••••••••"
                      />
                    </div>
                    {formData.password && formData.passwordConfirmation && (
                      <p className={`text-xs mt-1 flex items-center gap-1 ${formData.password === formData.passwordConfirmation ? 'text-green-400' : 'text-red-400'}`}>
                        {formData.password === formData.passwordConfirmation ? (
                          <><Check className="w-3 h-3" /> Passwords match</>
                        ) : (
                          'Passwords do not match'
                        )}
                      </p>
                    )}
                    {errors.passwordConfirmation && <p className="text-red-400 text-xs mt-1">{errors.passwordConfirmation}</p>}
                  </div>

                  <div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.terms}
                        onChange={(e) => updateFormData('terms', e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <span className="text-sm text-white/80">
                        I agree to the <Link href="/terms" className="text-blue-400 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>
                      </span>
                    </label>
                    {errors.terms && <p className="text-red-400 text-xs mt-1">{errors.terms}</p>}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-700">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="text-white/70 hover:text-white text-sm font-medium transition-colors"
                  >
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={isCheckingAvailability}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                  >
                    {isCheckingAvailability ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Login Link */}
          <p className="text-center text-white/70 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:underline font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
