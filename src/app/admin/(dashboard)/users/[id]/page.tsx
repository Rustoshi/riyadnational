'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MoreVertical,
  CreditCard,
  MinusCircle,
  FileText,
  Image,
  Key,
  Moon,
  Trash2,
  Edit,
  Mail,
  LogIn,
  Ban,
  CheckCircle,
  Shield,
  Settings,
  DollarSign,
  Bitcoin,
} from 'lucide-react';
import {
  Button,
  Card,
  StatusBadge,
  Modal,
  Input,
  Select,
  ConfirmDialog,
} from '@/components/ui';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;

  accountNumber: string;
  balance: number;
  bitcoinBalance?: number;
  accountType: string;
  status: string;
  kycStatus: string;
  emailVerified: boolean;
  country?: string;
  currency?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  dateOfBirth?: string;
  pin?: string;
  createdAt: string;
  dailyTransferLimit?: number;
  dailyWithdrawalLimit?: number;
  withdrawalFee?: number;
  cotCode?: string;
  imfCode?: string;
  profilePhoto?: string;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  description?: string;
  createdAt: string;
}

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
];

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
    };
    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionMenu]);

  // Modals
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showDebitModal, setShowDebitModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showProfilePicModal, setShowProfilePicModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [showUsageLimitsModal, setShowUsageLimitsModal] = useState(false);
  const [showBankingCodesModal, setShowBankingCodesModal] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showClearAccountDialog, setShowClearAccountDialog] = useState(false);

  // Form states
  const [creditForm, setCreditForm] = useState({
    amount: '',
    balanceType: 'cash',
    scope: '',
    sender: '',
    description: '',
    date: '',
    notifyUser: false,
  });

  const [debitForm, setDebitForm] = useState({
    amount: '',
    balanceType: 'cash',
    scope: '',
    receiverBank: '',
    receiverName: '',
    receiverAccount: '',
    bankAddress: '',
    description: '',
    date: '',
    notifyUser: false,
  });

  const [editForm, setEditForm] = useState({

    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    currency: '',
    accountNumber: '',
    balance: '',
    bitcoinBalance: '',
    cotCode: '',
    imfCode: '',
    accountType: '',
    dailyTransferLimit: '',
    dailyWithdrawalLimit: '',
    withdrawalFee: '',
    pin: '',
    status: '',
    createdAt: '',
  });

  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: '',
  });

  const [usageLimitsForm, setUsageLimitsForm] = useState({
    dailyTransferLimit: '',
    dailyWithdrawalLimit: '',
  });

  const [bankingCodesForm, setBankingCodesForm] = useState({
    cotCode: '',
    imfCode: '',
  });

  const [generateForm, setGenerateForm] = useState({
    minAmount: '',
    maxAmount: '',
    fromDate: '',
    toDate: '',
    numberOfTransactions: '',
  });

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data.user);
        setTransactions(data.data.transactions || []);
        // Initialize edit form with user data
        const u = data.data.user;
        setEditForm({

          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          dateOfBirth: u.dateOfBirth ? new Date(u.dateOfBirth).toISOString().split('T')[0] : '',
          address: u.address || '',
          city: u.city || '',
          zipCode: u.zipCode || '',
          country: u.country || '',
          currency: u.currency || 'USD',
          accountNumber: u.accountNumber || '',
          balance: u.balance?.toString() || '0',
          bitcoinBalance: u.bitcoinBalance?.toString() || '0',
          cotCode: u.cotCode || '',
          imfCode: u.imfCode || '',
          accountType: u.accountType || '',
          dailyTransferLimit: u.dailyTransferLimit?.toString() || '',
          dailyWithdrawalLimit: u.dailyWithdrawalLimit?.toString() || '',
          withdrawalFee: u.withdrawalFee?.toString() || '',
          pin: u.pin && !u.pin.startsWith('$2a$') ? u.pin : '',
          status: u.status || '',
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 16) : '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      console.log('Submitting credit:', { amount: creditForm.amount, scope: creditForm.scope });
      const res = await fetch(`/api/admin/users/${userId}/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'credit',
          amount: parseFloat(creditForm.amount),
          balanceType: creditForm.balanceType,
          scope: creditForm.scope,
          sender: creditForm.sender,
          description: creditForm.description,
          date: creditForm.date,
          notifyUser: creditForm.notifyUser,
        }),
      });
      const data = await res.json();
      console.log('Credit response:', data);
      if (res.ok && data.success) {
        setShowCreditModal(false);
        setCreditForm({ amount: '', balanceType: 'cash', scope: '', sender: '', description: '', date: '', notifyUser: false });
        fetchUser();
        alert('Account credited successfully!');
      } else {
        alert(data.message || 'Failed to credit account');
      }
    } catch (error) {
      console.error('Credit failed:', error);
      alert('Failed to credit account. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDebit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${userId}/topup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'debit',
          amount: parseFloat(debitForm.amount),
          balanceType: debitForm.balanceType,
          scope: debitForm.scope,
          receiverBank: debitForm.receiverBank,
          receiverName: debitForm.receiverName,
          receiverAccount: debitForm.receiverAccount,
          bankAddress: debitForm.bankAddress,
          description: debitForm.description,
          date: debitForm.date,
          notifyUser: debitForm.notifyUser,
        }),
      });
      if (res.ok) {
        setShowDebitModal(false);
        setDebitForm({ amount: '', balanceType: 'cash', scope: '', receiverBank: '', receiverName: '', receiverAccount: '', bankAddress: '', description: '', date: '', notifyUser: false });
        fetchUser();
      }
    } catch (error) {
      console.error('Debit failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');

      // Prepare form data - only include PIN if it's not empty
      const formDataToSend = { ...editForm };
      if (!formDataToSend.pin || formDataToSend.pin.trim() === '') {
        delete (formDataToSend as Record<string, unknown>).pin;
      }

      console.log('[Edit User] Sending data:', formDataToSend);
      console.log('[Edit User] createdAt value:', formDataToSend.createdAt);

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formDataToSend),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowEditModal(false);
        fetchUser();
        alert('User updated successfully!');
      } else {
        alert(data.error || data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Edit failed:', error);
      alert('Failed to update user. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${userId}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(emailForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowEmailModal(false);
        setEmailForm({ subject: '', message: '' });
        alert('Email sent successfully!');
      } else {
        alert(data.error || data.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Send email failed:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBlockToggle = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const action = user?.status === 'blocked' ? 'unblock' : 'block';
      const res = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setShowBlockDialog(false);
        fetchUser();
      }
    } catch (error) {
      console.error('Block toggle failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        router.push('/admin/users');
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyEmail = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`/api/admin/users/${userId}/verify-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUser();
    } catch (error) {
      console.error('Verify email failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDormantToggle = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const isDormant = user?.status === 'dormant';
      await fetch(`/api/admin/users/${userId}/dormant`, {
        method: isDormant ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUser();
    } catch (error) {
      console.error('Dormant toggle failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoginAsUser = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${userId}/login-as`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        // Store user token and redirect to user dashboard
        localStorage.setItem('userToken', data.data.token);
        window.open('/dashboard', '_blank');
      }
    } catch (error) {
      console.error('Login as user failed:', error);
    }
  };

  const handleClearAccount = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`/api/admin/users/${userId}/clear`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowClearAccountDialog(false);
      fetchUser();
    } catch (error) {
      console.error('Clear account failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert(`Password has been reset to: ${data.data?.defaultPassword || 'user01236'}`);
      }
    } catch (error) {
      console.error('Reset password failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${userId}/generate-transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          minAmount: parseFloat(generateForm.minAmount),
          maxAmount: parseFloat(generateForm.maxAmount),
          fromDate: generateForm.fromDate,
          toDate: generateForm.toDate,
          numberOfTransactions: parseInt(generateForm.numberOfTransactions),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowGenerateModal(false);
        setGenerateForm({ minAmount: '', maxAmount: '', fromDate: '', toDate: '', numberOfTransactions: '' });
        fetchUser();
        alert(`${data.data?.transactionsGenerated || 'Multiple'} transactions generated successfully!`);
      } else {
        alert(data.message || 'Failed to generate transactions');
      }
    } catch (error) {
      console.error('Generate transaction failed:', error);
      alert('Failed to generate transactions. Check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProfilePhotoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePhoto) return;

    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('photo', profilePhoto);

      const res = await fetch(`/api/admin/users/${userId}/profile-photo`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowProfilePicModal(false);
        setProfilePhoto(null);
        fetchUser();
        alert('Profile photo updated successfully!');
      } else {
        alert(data.message || 'Failed to upload profile photo');
      }
    } catch (error) {
      console.error('Profile photo upload failed:', error);
      alert('Failed to upload profile photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUsageLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${userId}/usage-limits`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(usageLimitsForm),
      });
      if (res.ok) {
        setShowUsageLimitsModal(false);
        fetchUser();
      }
    } catch (error) {
      console.error('Update usage limits failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBankingCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/users/${userId}/banking-codes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bankingCodesForm),
      });
      if (res.ok) {
        setShowBankingCodesModal(false);
        fetchUser();
      }
    } catch (error) {
      console.error('Update banking codes failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-[var(--surface)] rounded animate-pulse" />
        <div className="h-64 bg-[var(--surface)] rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)]">User not found</p>
        <Link href="/admin/users">
          <Button variant="secondary" className="mt-4">Back to Users</Button>
        </Link>
      </div>
    );
  }

  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            {user.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center">
                <span className="text-lg font-bold text-white">{initials}</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{user.name}</h1>
              <p className="text-sm text-[var(--text-muted)]">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Actions Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="secondary"
            onClick={() => setShowActionMenu(!showActionMenu)}
            rightIcon={<MoreVertical className="w-4 h-4" />}
          >
            Actions
          </Button>

          {showActionMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-50 py-1 max-h-[70vh] overflow-y-auto">
              {/* Verify Email - only show if not verified */}
              {!user.emailVerified && (
                <button onClick={() => { handleVerifyEmail(); setShowActionMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg)]">
                  <CheckCircle className="w-4 h-4 text-blue-500" /> Verify Email
                </button>
              )}
              <button
                onClick={() => {
                  setShowActionMenu(false);
                  setShowCreditModal(true);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg)]"
              >
                <CreditCard className="w-4 h-4 text-green-500" /> Credit Account
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionMenu(false);
                  setTimeout(() => setShowDebitModal(true), 10);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg)]"
              >
                <MinusCircle className="w-4 h-4 text-red-500" /> Debit Account
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionMenu(false);
                  setTimeout(() => setShowGenerateModal(true), 10);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg)]"
              >
                <FileText className="w-4 h-4 text-purple-500" /> Generate Transaction
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionMenu(false);
                  setTimeout(() => setShowProfilePicModal(true), 10);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg)]"
              >
                <Image className="w-4 h-4 text-indigo-500" /> Change Profile Pics
              </button>
              <button onClick={() => { handleResetPassword(); setShowActionMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg)]">
                <Key className="w-4 h-4 text-yellow-600" /> Reset Password
              </button>
              {/* Dormant Account Toggle */}
              <button onClick={() => { handleDormantToggle(); setShowActionMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg)]">
                <Moon className="w-4 h-4 text-gray-500" /> {user.status === 'dormant' ? 'Turn Off Dormant Account' : 'Turn On Dormant Account'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionMenu(false);
                  setTimeout(() => setShowClearAccountDialog(true), 10);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg)]"
              >
                <Trash2 className="w-4 h-4 text-orange-500" /> Clear Account
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionMenu(false);
                  setTimeout(() => setShowUsageLimitsModal(true), 10);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg)]"
              >
                <Settings className="w-4 h-4 text-gray-600" /> Account Usage Limits
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionMenu(false);
                  setTimeout(() => setShowBankingCodesModal(true), 10);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg)]"
              >
                <Shield className="w-4 h-4 text-blue-600" /> Banking Authorization Codes
              </button>
              <hr className="my-1 border-[var(--border)]" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionMenu(false);
                  setTimeout(() => setShowEditModal(true), 10);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg)]"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionMenu(false);
                  setTimeout(() => setShowEmailModal(true), 10);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg)]"
              >
                <Mail className="w-4 h-4" /> Send Email
              </button>
              <button onClick={() => { handleLoginAsUser(); setShowActionMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-[var(--bg)]">
                <LogIn className="w-4 h-4" /> Login as {user.name}
              </button>
              <Link href={`/admin/users/${userId}/activity`} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg)]">
                <FileText className="w-4 h-4" /> Login Activity
              </Link>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionMenu(false);
                  setTimeout(() => setShowBlockDialog(true), 10);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--bg)]"
              >
                {user.status === 'blocked' ? (
                  <><CheckCircle className="w-4 h-4 text-green-500" /> Unblock</>
                ) : (
                  <><Ban className="w-4 h-4 text-orange-500" /> Block</>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionMenu(false);
                  setTimeout(() => setShowDeleteDialog(true), 10);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-[var(--bg)]"
              >
                <Trash2 className="w-4 h-4" /> Delete {user.name}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Fiat Balance</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{formatCurrency(user.balance, user.currency)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Bitcoin className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Bitcoin Balance</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{user.bitcoinBalance || '0.00'} BTC</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Daily Transfer Limit</p>
              <p className="text-xl font-semibold text-[var(--text-primary)]">{formatCurrency(user.dailyTransferLimit || 0)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">Account Status</p>
              <StatusBadge status={user.status} />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">KYC Status</p>
              <StatusBadge status={user.kycStatus} />
            </div>
          </div>
        </Card>
      </div>

      {/* User Information */}
      <Card>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">USER INFORMATION</h2>
        <div className="divide-y divide-[var(--border)]">
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="text-[var(--text-muted)]">Fullname</span>
            <span className="md:col-span-2 font-medium">{user.name}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="text-[var(--text-muted)]">Email Address</span>
            <span className="md:col-span-2 font-medium">{user.email}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="text-[var(--text-muted)]">Mobile Number</span>
            <span className="md:col-span-2 font-medium">{user.phone || 'Not provided'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="text-[var(--text-muted)]">Account Number</span>
            <span className="md:col-span-2 font-mono font-medium">{user.accountNumber}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="text-[var(--text-muted)]">4 Digit Transaction Pin</span>
            <span className="md:col-span-2 font-mono font-medium">
              {user.pin ? (user.pin.startsWith('$2a$') ? '•••• (Encrypted - Reset to view)' : user.pin) : 'Not set'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="text-[var(--text-muted)]">COT Code</span>
            <span className="md:col-span-2 font-mono font-medium">{user.cotCode || 'Not set'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="text-[var(--text-muted)]">IMF Code</span>
            <span className="md:col-span-2 font-mono font-medium">{user.imfCode || 'Not set'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="text-[var(--text-muted)]">Date of Birth</span>
            <span className="md:col-span-2 font-medium">{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="text-[var(--text-muted)]">Nationality</span>
            <span className="md:col-span-2 font-medium">{user.country || 'Not provided'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="text-[var(--text-muted)]">Address</span>
            <span className="md:col-span-2 font-medium">{user.address || 'Not provided'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="text-[var(--text-muted)]">Account Type</span>
            <span className="md:col-span-2 font-medium capitalize">{user.accountType}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 py-3">
            <span className="text-[var(--text-muted)]">Registered</span>
            <span className="md:col-span-2 font-medium">{formatDate(user.createdAt)}</span>
          </div>
        </div>
      </Card>

      {/* Credit Modal */}
      <Modal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        title="Credit Account"
      >
        <form onSubmit={handleCredit} className="space-y-4">
          <Input
            label="Amount"
            type="number"
            value={creditForm.amount}
            onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
            required
          />
          <Select
            label="Balance Type"
            options={[
              { value: 'cash', label: `Cash Balance (${user?.currency || 'USD'})` },
              { value: 'crypto', label: 'Crypto Balance (BTC)' },
            ]}
            value={creditForm.balanceType}
            onChange={(e) => setCreditForm({ ...creditForm, balanceType: e.target.value })}
            required
          />
          <Select
            label="Transfer Scope"
            options={[
              { value: '', label: 'Select type' },
              { value: 'international', label: 'International Transfer' },
              { value: 'local', label: 'Local Transfer' },
              { value: 'crypto', label: 'Crypto Deposit' },
              { value: 'check', label: 'Check Deposit' },
            ]}
            value={creditForm.scope}
            onChange={(e) => setCreditForm({ ...creditForm, scope: e.target.value })}
            required
          />
          <Input
            label="Sender Name"
            value={creditForm.sender}
            onChange={(e) => setCreditForm({ ...creditForm, sender: e.target.value })}
          />
          <Input
            label="Description"
            value={creditForm.description}
            onChange={(e) => setCreditForm({ ...creditForm, description: e.target.value })}
          />
          <Input
            label="Date (Backdate transaction)"
            type="datetime-local"
            value={creditForm.date}
            onChange={(e) => setCreditForm({ ...creditForm, date: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notifyCredit"
              checked={creditForm.notifyUser}
              onChange={(e) => setCreditForm({ ...creditForm, notifyUser: e.target.checked })}
            />
            <label htmlFor="notifyCredit" className="text-sm">Send email notification to user</label>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreditModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={isProcessing}>Credit Account</Button>
          </div>
        </form>
      </Modal>

      {/* Debit Modal */}
      <Modal
        isOpen={showDebitModal}
        onClose={() => setShowDebitModal(false)}
        title="Debit Account"
      >
        <form onSubmit={handleDebit} className="space-y-4">
          <Input
            label="Amount"
            type="number"
            value={debitForm.amount}
            onChange={(e) => setDebitForm({ ...debitForm, amount: e.target.value })}
            required
          />
          <Select
            label="Balance Type"
            options={[
              { value: 'cash', label: `Cash Balance (${user?.currency || 'USD'})` },
              { value: 'crypto', label: 'Crypto Balance (BTC)' },
            ]}
            value={debitForm.balanceType}
            onChange={(e) => setDebitForm({ ...debitForm, balanceType: e.target.value })}
            required
          />
          <Select
            label="Transfer Scope"
            options={[
              { value: '', label: 'Select type' },
              { value: 'international', label: 'International Transfer' },
              { value: 'local', label: 'Local Transfer' },
              { value: 'crypto', label: 'Crypto Withdrawal' },
            ]}
            value={debitForm.scope}
            onChange={(e) => setDebitForm({ ...debitForm, scope: e.target.value })}
            required
          />
          <Input
            label="Receiver's Bank"
            value={debitForm.receiverBank}
            onChange={(e) => setDebitForm({ ...debitForm, receiverBank: e.target.value })}
          />
          <Input
            label="Receiver's Name"
            value={debitForm.receiverName}
            onChange={(e) => setDebitForm({ ...debitForm, receiverName: e.target.value })}
          />
          <Input
            label="Receiver's Account Number"
            value={debitForm.receiverAccount}
            onChange={(e) => setDebitForm({ ...debitForm, receiverAccount: e.target.value })}
          />
          <Input
            label="Description"
            value={debitForm.description}
            onChange={(e) => setDebitForm({ ...debitForm, description: e.target.value })}
          />
          <Input
            label="Date (Backdate transaction)"
            type="datetime-local"
            value={debitForm.date}
            onChange={(e) => setDebitForm({ ...debitForm, date: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="notifyDebit"
              checked={debitForm.notifyUser}
              onChange={(e) => setDebitForm({ ...debitForm, notifyUser: e.target.checked })}
            />
            <label htmlFor="notifyDebit" className="text-sm">Send email notification to user</label>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowDebitModal(false)}>Cancel</Button>
            <Button type="submit" variant="danger" isLoading={isProcessing}>Debit Account</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit ${user.name} details`}
      >
        <form onSubmit={handleEdit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <Input

          />
          <Input
            label="Full Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          <Input
            label="Date of Birth"
            type="date"
            value={editForm.dateOfBirth}
            onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
          />
          <Input
            label="Address"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
          />
          <Input
            label="City"
            value={editForm.city}
            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
          />
          <Input
            label="Zip Code"
            value={editForm.zipCode}
            onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value })}
          />
          <Input
            label="Country/Nationality"
            value={editForm.country}
            onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
          />
          <Select
            label="Currency"
            options={currencies.map(c => ({ value: c.code, label: `${c.code} - ${c.name} (${c.symbol})` }))}
            value={editForm.currency}
            onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}
          />
          <Input
            label="Account Number"
            value={editForm.accountNumber}
            onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
          />
          <Input
            label="Account Balance ($)"
            type="number"
            value={editForm.balance}
            onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })}
            step="0.01"
          />
          <Input
            label="Bitcoin Balance (BTC)"
            type="number"
            value={editForm.bitcoinBalance}
            onChange={(e) => setEditForm({ ...editForm, bitcoinBalance: e.target.value })}
            step="0.00000001"
          />
          <Input
            label="COT Code"
            value={editForm.cotCode}
            onChange={(e) => setEditForm({ ...editForm, cotCode: e.target.value })}
          />
          <Input
            label="IMF Code"
            value={editForm.imfCode}
            onChange={(e) => setEditForm({ ...editForm, imfCode: e.target.value })}
          />
          <Select
            label="Account Type"
            options={[
              { value: 'checking', label: 'Checking Account' },
              { value: 'savings', label: 'Savings Account' },
              { value: 'fixed', label: 'Fixed Deposit Account' },
              { value: 'current', label: 'Current Account' },
              { value: 'crypto', label: 'Crypto Currency Account' },
              { value: 'business', label: 'Business Account' },
              { value: 'non_resident', label: 'Non Resident Account' },
              { value: 'corporate', label: 'Corporate Business Account' },
              { value: 'investment', label: 'Investment Account' },
            ]}
            value={editForm.accountType}
            onChange={(e) => setEditForm({ ...editForm, accountType: e.target.value })}
          />
          <Input
            label="Daily Transfer Limit ($)"
            type="number"
            value={editForm.dailyTransferLimit}
            onChange={(e) => setEditForm({ ...editForm, dailyTransferLimit: e.target.value })}
          />
          <Input
            label="Daily Withdrawal Limit ($)"
            type="number"
            value={editForm.dailyWithdrawalLimit}
            onChange={(e) => setEditForm({ ...editForm, dailyWithdrawalLimit: e.target.value })}
          />
          <Input
            label="Withdrawal Fee ($)"
            type="number"
            value={editForm.withdrawalFee}
            onChange={(e) => setEditForm({ ...editForm, withdrawalFee: e.target.value })}
            placeholder="0"
          />
          <p className="text-xs text-gray-500 -mt-2">
            Set account status to inactive if you want client to pay withdrawal fee
          </p>
          <Input
            label="4 Digit Transaction PIN"
            value={editForm.pin}
            onChange={(e) => setEditForm({ ...editForm, pin: e.target.value })}
            maxLength={4}
          />
          <Select
            label="Account Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
              { value: 'blocked', label: 'Blocked' },
              { value: 'dormant', label: 'Dormant' },
              { value: 'frozen', label: 'Frozen' },
            ]}
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
          />
          <Input
            label="Account Age/Date Created (Backdate account age)"
            type="datetime-local"
            value={editForm.createdAt}
            onChange={(e) => setEditForm({ ...editForm, createdAt: e.target.value })}
          />
          <div className="flex gap-2 pt-4 sticky bottom-0 bg-[var(--surface)] py-2">
            <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={isProcessing}>Update</Button>
          </div>
        </form>
      </Modal>

      {/* Email Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title={`Send Email to ${user.name}`}
      >
        <form onSubmit={handleSendEmail} className="space-y-4">
          {/* Sender/Recipient Info */}
          <div className="bg-[var(--bg)] rounded-lg p-3 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)] w-16">From:</span>
              <span className="text-[var(--text-primary)] font-medium">
                support@{typeof window !== 'undefined' ? window.location.hostname : 'domain.com'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)] w-16">To:</span>
              <span className="text-[var(--text-primary)] font-medium">{user.email}</span>
            </div>
          </div>

          <Input
            label="Subject"
            value={emailForm.subject}
            onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
            placeholder="Enter email subject"
            required
          />
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Message</label>
            <textarea
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              rows={8}
              value={emailForm.message}
              onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
              placeholder="Enter your message here..."
              required
            />
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowEmailModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={isProcessing}>Send Email</Button>
          </div>
        </form>
      </Modal>

      {/* Block/Unblock Dialog */}
      <ConfirmDialog
        isOpen={showBlockDialog}
        onClose={() => setShowBlockDialog(false)}
        onConfirm={handleBlockToggle}
        title={user.status === 'blocked' ? 'Unblock User' : 'Block User'}
        message={
          user.status === 'blocked'
            ? `Are you sure you want to unblock ${user.name}? They will be able to access their account again.`
            : `Are you sure you want to block ${user.name}? They will not be able to access their account.`
        }
        confirmText={user.status === 'blocked' ? 'Unblock' : 'Block'}
        variant={user.status === 'blocked' ? 'primary' : 'danger'}
        isLoading={isProcessing}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${user.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isProcessing}
      />

      {/* Clear Account Dialog */}
      <ConfirmDialog
        isOpen={showClearAccountDialog}
        onClose={() => setShowClearAccountDialog(false)}
        onConfirm={handleClearAccount}
        title="Clear Account"
        message={`Are you sure you want to clear ${user.name}'s account? This will reset all balances to $0.00 and delete all transactions.`}
        confirmText="Clear Account"
        variant="danger"
        isLoading={isProcessing}
      />

      {/* Usage Limits Modal */}
      <Modal
        isOpen={showUsageLimitsModal}
        onClose={() => setShowUsageLimitsModal(false)}
        title="Set Usage Limits"
      >
        <form onSubmit={handleUsageLimits} className="space-y-4">
          <Input
            label="Daily Transfer Limit ($)"
            type="number"
            value={usageLimitsForm.dailyTransferLimit}
            onChange={(e) => setUsageLimitsForm({ ...usageLimitsForm, dailyTransferLimit: e.target.value })}
          />
          <Input
            label="Daily Withdrawal Limit ($)"
            type="number"
            value={usageLimitsForm.dailyWithdrawalLimit}
            onChange={(e) => setUsageLimitsForm({ ...usageLimitsForm, dailyWithdrawalLimit: e.target.value })}
          />
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowUsageLimitsModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={isProcessing}>Update Limits</Button>
          </div>
        </form>
      </Modal>

      {/* Banking Codes Modal */}
      <Modal
        isOpen={showBankingCodesModal}
        onClose={() => setShowBankingCodesModal(false)}
        title="Banking Authorization Codes"
      >
        <form onSubmit={handleBankingCodes} className="space-y-4">
          <Input
            label="COT Code"
            value={bankingCodesForm.cotCode}
            onChange={(e) => setBankingCodesForm({ ...bankingCodesForm, cotCode: e.target.value })}
          />
          <Input
            label="IMF Code"
            value={bankingCodesForm.imfCode}
            onChange={(e) => setBankingCodesForm({ ...bankingCodesForm, imfCode: e.target.value })}
          />
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowBankingCodesModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={isProcessing}>Update Codes</Button>
          </div>
        </form>
      </Modal>

      {/* Profile Photo Modal */}
      <Modal
        isOpen={showProfilePicModal}
        onClose={() => { setShowProfilePicModal(false); setProfilePhoto(null); }}
        title="Change Profile Picture"
      >
        <form onSubmit={handleProfilePhotoUpload} className="space-y-4">
          {/* Preview current or selected photo */}
          <div className="flex justify-center">
            {profilePhoto ? (
              <img
                src={URL.createObjectURL(profilePhoto)}
                alt="Preview"
                className="w-32 h-32 rounded-full object-cover border-4 border-[var(--primary)]"
              />
            ) : user.profilePhoto ? (
              <img
                src={user.profilePhoto}
                alt={user.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-[var(--border)]"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-[var(--primary)] flex items-center justify-center border-4 border-[var(--border)]">
                <span className="text-4xl font-bold text-white">{initials}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Select Photo</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={(e) => setProfilePhoto(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)]"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">Accepted formats: JPEG, JPG, PNG, WebP. Max size: 4MB</p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowProfilePicModal(false); setProfilePhoto(null); }}>Cancel</Button>
            <Button type="submit" isLoading={isProcessing} disabled={!profilePhoto}>Upload Photo</Button>
          </div>
        </form>
      </Modal>

      {/* Generate Transaction Modal */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title={`Generate Transactions for ${user.name}`}
      >
        <form onSubmit={handleGenerateTransaction} className="space-y-4">
          <Input
            label="Min Amount"
            type="number"
            placeholder="Enter minimum amount"
            value={generateForm.minAmount}
            onChange={(e) => setGenerateForm({ ...generateForm, minAmount: e.target.value })}
            required
          />
          <Input
            label="Max Amount"
            type="number"
            placeholder="Enter maximum amount"
            value={generateForm.maxAmount}
            onChange={(e) => setGenerateForm({ ...generateForm, maxAmount: e.target.value })}
            required
          />
          <Input
            label="From Date"
            type="datetime-local"
            value={generateForm.fromDate}
            onChange={(e) => setGenerateForm({ ...generateForm, fromDate: e.target.value })}
            required
          />
          <Input
            label="To Date"
            type="datetime-local"
            value={generateForm.toDate}
            onChange={(e) => setGenerateForm({ ...generateForm, toDate: e.target.value })}
            required
          />
          <Input
            label="Number of Transactions to Generate"
            type="number"
            placeholder="Enter number of transactions (max 200)"
            value={generateForm.numberOfTransactions}
            onChange={(e) => setGenerateForm({ ...generateForm, numberOfTransactions: e.target.value })}
            min="1"
            max="200"
            required
          />
          <p className="text-xs text-[var(--text-muted)] -mt-2">
            Maximum 200 transactions can be generated at once.
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            This will generate random Credit and Debit transactions with random amounts between min and max,
            random dates between the date range, and random bank details. The user&apos;s balance will be updated accordingly.
          </p>
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={isProcessing}>Generate Transactions</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
