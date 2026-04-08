'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight,
  CreditCard,
  QrCode,
  Info,
  Copy,
  CheckCircle,
  Upload,
  XCircle,
  Loader2,
  Building2,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { getUserCurrencySymbol } from '@/lib/currency';
import toast from 'react-hot-toast';

interface PaymentMethod {
  _id: string;
  name: string;
  type: string;
  details: {
    walletAddress?: string;
    network?: string;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    swiftCode?: string;
    iban?: string;
    routingNumber?: string;
    [key: string]: unknown;
  };
  instructions?: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  feeType: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User's currency
  const userCurrency = user?.currency || 'USD';
  const currencySymbol = getUserCurrencySymbol(userCurrency);

  // State
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>('');
  const [copied, setCopied] = useState<string>('');

  // Fetch payment method details
  useEffect(() => {
    const fetchPaymentMethod = async () => {
      const storedAmount = sessionStorage.getItem('depositAmount');
      const methodId = sessionStorage.getItem('depositMethodId');

      if (!storedAmount || !methodId) {
        toast.error('Please select a deposit method first');
        router.push('/dashboard/deposit');
        return;
      }

      setAmount(storedAmount);

      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch('/api/user/payment-methods', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const method = data.data?.find((m: PaymentMethod) => m._id === methodId);
          if (method) {
            setPaymentMethod(method);
          } else {
            toast.error('Payment method not found');
            router.push('/dashboard/deposit');
          }
        }
      } catch (error) {
        console.error('Failed to fetch payment method:', error);
        toast.error('Failed to load payment details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentMethod();
  }, [router]);

  // Copy to clipboard
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a JPG, PNG, or PDF file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }

      setProofFile(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProofPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setProofPreview('');
      }
    }
  };

  // Remove selected file
  const removeFile = () => {
    setProofFile(null);
    setProofPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!proofFile) {
      toast.error('Please upload proof of payment');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again');
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(proofFile);
      reader.onloadend = async () => {
        const base64 = reader.result as string;

        const response = await fetch('/api/user/deposits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
            paymentMethod: paymentMethod?._id,
            proofImage: base64,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          toast.success('Deposit request submitted successfully!');
          // Clear session storage
          sessionStorage.removeItem('depositAmount');
          sessionStorage.removeItem('depositMethodId');
          router.push('/dashboard/transactions');
        } else {
          toast.error(data.error || 'Failed to submit deposit');
        }

        setIsSubmitting(false);
      };
    } catch (error) {
      console.error('Failed to submit deposit:', error);
      toast.error('Failed to submit deposit');
      setIsSubmitting(false);
    }
  };

  // Generate QR code URL
  const getQrCodeUrl = () => {
    if (!paymentMethod?.details?.walletAddress) return '';
    
    let qrContent = paymentMethod.details.walletAddress;
    const nameLower = paymentMethod.name.toLowerCase();
    
    if (nameLower.includes('bitcoin')) {
      qrContent = `bitcoin:${paymentMethod.details.walletAddress}?amount=${amount}`;
    } else if (nameLower.includes('ethereum')) {
      qrContent = `ethereum:${paymentMethod.details.walletAddress}?value=${amount}`;
    } else if (nameLower.includes('litecoin')) {
      qrContent = `litecoin:${paymentMethod.details.walletAddress}?amount=${amount}`;
    }
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrContent)}`;
  };

  // Check if it's a crypto payment method
  const isCrypto = paymentMethod?.type === 'crypto' || 
    paymentMethod?.name.toLowerCase().includes('bitcoin') ||
    paymentMethod?.name.toLowerCase().includes('crypto') ||
    paymentMethod?.name.toLowerCase().includes('ethereum') ||
    paymentMethod?.name.toLowerCase().includes('litecoin');

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4" style={{color: "#9ca3af"}}>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!paymentMethod) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2" style={{color: "white"}}>Payment Method Not Found</h2>
          <p className="mb-6" style={{color: "#9ca3af"}}>Please select a deposit method first.</p>
          <Link
            href="/dashboard/deposit"
            className="inline-flex items-center px-4 py-2 rounded-lg transition-colors"
            style={{backgroundColor: 'rgb(8 145 178)', color: "white"}}
          >
            Go to Deposit
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{color: "white"}}>Make Deposit</h1>
        <div className="flex items-center text-sm" style={{color: "#9ca3af"}}>
          <Link href="/dashboard" className="hover:text-blue-400">Dashboard</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <Link href="/dashboard/deposit" className="hover:text-blue-400">Deposits</Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span style={{color: "#d1d5db"}}>Make Payment</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-xl shadow-md border border-gray-700 overflow-hidden" style={{backgroundColor: 'rgb(31 41 55)'}}>
        {/* Card Header */}
        <div className="border-b border-gray-700 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-blue-500" />
              <h2 className="text-xl font-semibold" style={{color: "white"}}>Payment Method: {paymentMethod.name}</h2>
            </div>
            <div className="mt-2 md:mt-0 md:ml-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" style={{backgroundColor: 'rgba(8, 145, 178, 0.2)', color: '#22d3ee'}}>
                Amount: {currencySymbol}{parseFloat(amount).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Payment Instructions */}
          <div className="p-4 rounded-lg mb-6 border border-blue-500/30" style={{backgroundColor: 'rgba(59, 130, 246, 0.1)'}}>
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-white" style={{color: "white"}}>Payment Instructions</h3>
                <p className="mt-1 text-sm" style={{color: "#93c5fd"}}>
                  You are to make payment of <strong>{currencySymbol}{parseFloat(amount).toLocaleString()}</strong> using your selected payment method. 
                  Screenshot and upload the proof of payment.
                </p>
              </div>
            </div>
          </div>

          {/* QR Code for Crypto */}
          {isCrypto && paymentMethod.details?.walletAddress && (
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-lg border border-gray-600 flex flex-col items-center w-full max-w-xs" style={{backgroundColor: 'rgb(55 65 81)'}}>
                <div className="h-12 w-12 rounded-full flex items-center justify-center mb-3" style={{backgroundColor: 'rgba(8, 145, 178, 0.2)'}}>
                  <QrCode className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-lg font-medium mb-3" style={{color: "white"}}>Scan QR Code</h3>
                <div className="p-2 rounded-lg border border-gray-600 mb-3 w-full flex justify-center" style={{backgroundColor: "white"}}>
                  <Image
                    src={getQrCodeUrl()}
                    alt="Payment QR Code"
                    width={192}
                    height={192}
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-center" style={{color: "white"}}>Scan the QR code with your payment app</p>
                <div className="mt-2 text-center w-full">
                  <p className="text-xs font-medium" style={{color: "#d1d5db"}}>{paymentMethod.name} Address:</p>
                  <p className="text-xs break-all" style={{color: "#9ca3af"}}>{paymentMethod.details.walletAddress}</p>
                  {paymentMethod.details.network && (
                    <>
                      <p className="text-xs font-medium mt-1" style={{color: "#d1d5db"}}>Network:</p>
                      <p className="text-xs" style={{color: "#9ca3af"}}>{paymentMethod.details.network}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Crypto Wallet Address */}
          {isCrypto && paymentMethod.details?.walletAddress && (
            <div className="p-5 rounded-lg border border-gray-600 mb-6" style={{backgroundColor: 'rgb(55 65 81)'}}>
              <h3 className="text-lg font-medium mb-4 flex items-center" style={{color: "white"}}>
                <Wallet className="h-5 w-5 mr-2 text-blue-500" />
                {paymentMethod.name} Address
              </h3>
              <div className="relative mb-4">
                <div className="flex">
                  <input
                    type="text"
                    value={paymentMethod.details.walletAddress}
                    readOnly
                    className="block w-full py-3 px-4 border border-gray-600 rounded-l-lg focus:outline-none"
                    style={{backgroundColor: 'rgb(31 41 55)', color: "white"}}
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(paymentMethod.details.walletAddress!, 'wallet')}
                    className="inline-flex items-center justify-center px-4 py-2 border border-l-0 border-gray-600 rounded-r-lg transition-colors hover:bg-gray-600"
                    style={{backgroundColor: 'rgb(55 65 81)'}}
                  >
                    {copied === 'wallet' ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <Copy className="h-5 w-5" style={{color: "#9ca3af"}} />
                    )}
                  </button>
                </div>
                {paymentMethod.details.network && (
                  <p className="mt-2 text-sm flex items-center" style={{color: "#9ca3af"}}>
                    <Info className="h-4 w-4 mr-1 text-blue-400" />
                    <strong>Network Type:</strong>&nbsp;{paymentMethod.details.network}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Bank Transfer Details */}
          {!isCrypto && (
            <div className="p-5 rounded-lg border border-gray-600 mb-6" style={{backgroundColor: 'rgb(55 65 81)'}}>
              <h3 className="text-lg font-medium mb-4 flex items-center" style={{color: "white"}}>
                <Building2 className="h-5 w-5 mr-2 text-blue-500" />
                {paymentMethod.name} Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethod.details.bankName && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: "#d1d5db"}}>Bank Name</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={paymentMethod.details.bankName}
                        readOnly
                        className="block w-full py-2 px-3 border border-gray-600 rounded-l-lg"
                        style={{backgroundColor: 'rgb(31 41 55)', color: "white"}}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentMethod.details.bankName!, 'bankName')}
                        className="inline-flex items-center justify-center px-3 py-2 border border-l-0 border-gray-600 rounded-r-lg hover:bg-gray-600"
                        style={{backgroundColor: 'rgb(55 65 81)'}}
                      >
                        {copied === 'bankName' ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" style={{color: "#9ca3af"}} />}
                      </button>
                    </div>
                  </div>
                )}
                {paymentMethod.details.accountName && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: "#d1d5db"}}>Account Name</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={paymentMethod.details.accountName}
                        readOnly
                        className="block w-full py-2 px-3 border border-gray-600 rounded-l-lg"
                        style={{backgroundColor: 'rgb(31 41 55)', color: "white"}}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentMethod.details.accountName!, 'accountName')}
                        className="inline-flex items-center justify-center px-3 py-2 border border-l-0 border-gray-600 rounded-r-lg hover:bg-gray-600"
                        style={{backgroundColor: 'rgb(55 65 81)'}}
                      >
                        {copied === 'accountName' ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" style={{color: "#9ca3af"}} />}
                      </button>
                    </div>
                  </div>
                )}
                {paymentMethod.details.accountNumber && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: "#d1d5db"}}>Account Number</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={paymentMethod.details.accountNumber}
                        readOnly
                        className="block w-full py-2 px-3 border border-gray-600 rounded-l-lg"
                        style={{backgroundColor: 'rgb(31 41 55)', color: "white"}}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentMethod.details.accountNumber!, 'accountNumber')}
                        className="inline-flex items-center justify-center px-3 py-2 border border-l-0 border-gray-600 rounded-r-lg hover:bg-gray-600"
                        style={{backgroundColor: 'rgb(55 65 81)'}}
                      >
                        {copied === 'accountNumber' ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" style={{color: "#9ca3af"}} />}
                      </button>
                    </div>
                  </div>
                )}
                {paymentMethod.details.routingNumber && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: "#d1d5db"}}>Routing Number</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={paymentMethod.details.routingNumber}
                        readOnly
                        className="block w-full py-2 px-3 border border-gray-600 rounded-l-lg"
                        style={{backgroundColor: 'rgb(31 41 55)', color: "white"}}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentMethod.details.routingNumber!, 'routingNumber')}
                        className="inline-flex items-center justify-center px-3 py-2 border border-l-0 border-gray-600 rounded-r-lg hover:bg-gray-600"
                        style={{backgroundColor: 'rgb(55 65 81)'}}
                      >
                        {copied === 'routingNumber' ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" style={{color: "#9ca3af"}} />}
                      </button>
                    </div>
                  </div>
                )}
                {paymentMethod.details.swiftCode && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: "#d1d5db"}}>Swift Code</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={paymentMethod.details.swiftCode}
                        readOnly
                        className="block w-full py-2 px-3 border border-gray-600 rounded-l-lg"
                        style={{backgroundColor: 'rgb(31 41 55)', color: "white"}}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentMethod.details.swiftCode!, 'swiftCode')}
                        className="inline-flex items-center justify-center px-3 py-2 border border-l-0 border-gray-600 rounded-r-lg hover:bg-gray-600"
                        style={{backgroundColor: 'rgb(55 65 81)'}}
                      >
                        {copied === 'swiftCode' ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" style={{color: "#9ca3af"}} />}
                      </button>
                    </div>
                  </div>
                )}
                {paymentMethod.details.iban && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: "#d1d5db"}}>IBAN</label>
                    <div className="flex">
                      <input
                        type="text"
                        value={paymentMethod.details.iban}
                        readOnly
                        className="block w-full py-2 px-3 border border-gray-600 rounded-l-lg"
                        style={{backgroundColor: 'rgb(31 41 55)', color: "white"}}
                      />
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentMethod.details.iban!, 'iban')}
                        className="inline-flex items-center justify-center px-3 py-2 border border-l-0 border-gray-600 rounded-r-lg hover:bg-gray-600"
                        style={{backgroundColor: 'rgb(55 65 81)'}}
                      >
                        {copied === 'iban' ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" style={{color: "#9ca3af"}} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Proof Upload Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{color: "#d1d5db"}}>Upload Payment Proof</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-all cursor-pointer"
                style={{backgroundColor: 'rgb(55 65 81)'}}
              >
                {!proofFile ? (
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="h-10 w-10 mb-2" style={{color: "#9ca3af"}} />
                    <p className="text-sm mb-2" style={{color: "#9ca3af"}}>
                      <span className="font-medium text-blue-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs" style={{color: "#6b7280"}}>PNG, JPG or PDF (max. 5MB)</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    {proofPreview ? (
                      <Image
                        src={proofPreview}
                        alt="Preview"
                        width={192}
                        height={192}
                        className="max-h-48 max-w-full mb-3 rounded-lg shadow-sm object-contain"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-lg flex items-center justify-center mb-3" style={{backgroundColor: 'rgb(31 41 55)'}}>
                        <CreditCard className="h-10 w-10" style={{color: "#9ca3af"}} />
                      </div>
                    )}
                    <p className="text-sm font-medium flex items-center" style={{color: "#d1d5db"}}>
                      {proofFile.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile();
                        }}
                        className="ml-2 text-red-400 hover:text-red-300"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting || !proofFile}
                className={`inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium transition-colors ${
                  !proofFile ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                style={{backgroundColor: 'rgb(8 145 178)', color: "white"}}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Submit Payment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
