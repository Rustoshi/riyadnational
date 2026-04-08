'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronRight, Shield, Upload, CheckCircle, Clock, XCircle,
  Loader2, CreditCard, BookOpen, Flag, Trash2, Info,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const DOCUMENT_TYPES = [
  { id: 'passport', name: "Int'l Passport", icon: BookOpen },
  { id: 'national_id', name: 'National ID', icon: Flag },
  { id: 'drivers_license', name: "Driver's License", icon: CreditCard },
];

interface KycData {
  _id: string;
  documentType: string;
  documentNumber: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export default function KycPage() {
  const { refreshUser } = useAuth();
  const [kycData, setKycData] = useState<KycData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState('passport');
  const [documentNumber, setDocumentNumber] = useState('');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchKyc = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch('/api/user/kyc', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.data) setKycData(data.data);
        }
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    };
    fetchKyc();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setImage: (v: string | null) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Please upload JPEG or PNG'); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max 5MB'); return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentNumber.trim()) { toast.error('Enter document number'); return; }
    if (!frontImage) { toast.error('Upload front of document'); return; }
    if (!selfieImage) { toast.error('Upload selfie'); return; }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ documentType, documentNumber, frontImage, backImage, selfieImage }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('KYC submitted!');
        setKycData(data.data);
        refreshUser?.();
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch { toast.error('Error occurred'); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;

  // Approved state
  if (kycData?.status === 'approved') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
        <div className="mb-6">
          <div className="flex items-center text-sm">
            <Link href="/dashboard" className="text-gray-500 hover:text-blue-400">Dashboard</Link>
            <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
            <span className="text-gray-300">KYC</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2" style={{color:'white'}}>KYC Verification</h1>
        </div>
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-8 text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{color:'white'}}>Verified</h2>
          <p className="text-gray-400 mb-6">Your identity has been verified.</p>
          <Link href="/dashboard" className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Pending state
  if (kycData?.status === 'pending') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
        <div className="mb-6">
          <div className="flex items-center text-sm">
            <Link href="/dashboard" className="text-gray-500 hover:text-blue-400">Dashboard</Link>
            <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
            <span className="text-gray-300">KYC</span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-2" style={{color:'white'}}>KYC Verification</h1>
        </div>
        <div className="bg-[#111111] rounded-xl border border-gray-800 p-8 text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2" style={{color:'white'}}>Under Review</h2>
          <p className="text-gray-400 mb-6">Your documents are being reviewed. This takes 1-2 business days.</p>
          <Link href="/dashboard" className="inline-flex items-center px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Form
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center text-sm">
          <Link href="/dashboard" className="text-gray-500 hover:text-blue-400">Dashboard</Link>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
          <span className="text-gray-300">KYC</span>
        </div>
        <h1 className="text-2xl font-bold text-white mt-2" style={{color:'white'}}>KYC Verification</h1>
      </div>

      {kycData?.status === 'rejected' && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex"><XCircle className="h-5 w-5 text-red-400 shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-400">Rejected</h3>
              <p className="text-sm text-gray-400">{kycData.rejectionReason || 'Please resubmit with valid documents.'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
        <div className="bg-gradient-to-r from-[#004B87] to-blue-700 p-6">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-white mr-3" />
            <div>
              <h2 className="text-xl font-bold text-white" style={{color:'white'}}>Identity Verification</h2>
              <p className="text-gray-200 text-sm">Complete KYC to unlock all features</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Document Type */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4" style={{color:'white'}}>Document Type</h3>
            <div className="grid grid-cols-3 gap-4">
              {DOCUMENT_TYPES.map((doc) => {
                const Icon = doc.icon;
                return (
                  <label key={doc.id} className={`flex flex-col items-center p-4 rounded-lg border cursor-pointer ${documentType === doc.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'}`}>
                    <input type="radio" name="documentType" value={doc.id} checked={documentType === doc.id} onChange={(e) => setDocumentType(e.target.value)} className="sr-only" />
                    <Icon className={`h-6 w-6 mb-2 ${documentType === doc.id ? 'text-blue-400' : 'text-gray-400'}`} />
                    <span className="text-white text-sm">{doc.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Document Number */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Document Number *</label>
            <input type="text" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="Enter document number" className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white" required />
          </div>

          {/* Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex"><Info className="h-5 w-5 text-blue-400 shrink-0" />
              <div className="ml-3 text-sm text-gray-400">
                <p className="text-white font-medium mb-1" style={{color:'white'}}>Requirements</p>
                <p>• Document must not be expired • Clear and readable • All corners visible</p>
              </div>
            </div>
          </div>

          {/* Front Upload */}
          <div>
            <h3 className="text-lg font-medium text-white mb-2" style={{color:'white'}}>Front of Document *</h3>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center ${frontImage ? 'border-blue-500' : 'border-gray-700'}`}>
              <input type="file" ref={frontInputRef} onChange={(e) => handleFileUpload(e, setFrontImage)} accept="image/*" className="hidden" />
              {frontImage ? (
                <div><div className="relative w-48 h-32 mx-auto"><Image src={frontImage} alt="Front" fill className="object-cover rounded-lg" /></div>
                  <button type="button" onClick={() => { setFrontImage(null); if(frontInputRef.current) frontInputRef.current.value=''; }} className="mt-2 text-red-400 text-sm inline-flex items-center"><Trash2 className="h-4 w-4 mr-1" />Remove</button></div>
              ) : (
                <button type="button" onClick={() => frontInputRef.current?.click()} className="w-full"><Upload className="h-10 w-10 text-gray-500 mx-auto mb-2" /><p className="text-gray-400">Click to upload</p></button>
              )}
            </div>
          </div>

          {/* Back Upload */}
          <div>
            <h3 className="text-lg font-medium text-white mb-2" style={{color:'white'}}>Back of Document (Optional)</h3>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center ${backImage ? 'border-blue-500' : 'border-gray-700'}`}>
              <input type="file" ref={backInputRef} onChange={(e) => handleFileUpload(e, setBackImage)} accept="image/*" className="hidden" />
              {backImage ? (
                <div><div className="relative w-48 h-32 mx-auto"><Image src={backImage} alt="Back" fill className="object-cover rounded-lg" /></div>
                  <button type="button" onClick={() => { setBackImage(null); if(backInputRef.current) backInputRef.current.value=''; }} className="mt-2 text-red-400 text-sm inline-flex items-center"><Trash2 className="h-4 w-4 mr-1" />Remove</button></div>
              ) : (
                <button type="button" onClick={() => backInputRef.current?.click()} className="w-full"><Upload className="h-10 w-10 text-gray-500 mx-auto mb-2" /><p className="text-gray-400">Click to upload</p></button>
              )}
            </div>
          </div>

          {/* Selfie Upload */}
          <div>
            <h3 className="text-lg font-medium text-white mb-2" style={{color:'white'}}>Selfie with Document *</h3>
            <div className={`border-2 border-dashed rounded-lg p-6 text-center ${selfieImage ? 'border-blue-500' : 'border-gray-700'}`}>
              <input type="file" ref={selfieInputRef} onChange={(e) => handleFileUpload(e, setSelfieImage)} accept="image/*" className="hidden" />
              {selfieImage ? (
                <div><div className="relative w-48 h-32 mx-auto"><Image src={selfieImage} alt="Selfie" fill className="object-cover rounded-lg" /></div>
                  <button type="button" onClick={() => { setSelfieImage(null); if(selfieInputRef.current) selfieInputRef.current.value=''; }} className="mt-2 text-red-400 text-sm inline-flex items-center"><Trash2 className="h-4 w-4 mr-1" />Remove</button></div>
              ) : (
                <button type="button" onClick={() => selfieInputRef.current?.click()} className="w-full"><Upload className="h-10 w-10 text-gray-500 mx-auto mb-2" /><p className="text-gray-400">Click to upload selfie</p></button>
              )}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium flex items-center justify-center">
            {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Submitting...</> : <><CheckCircle className="h-5 w-5 mr-2" />Submit KYC</>}
          </button>
        </form>
      </div>
    </div>
  );
}
