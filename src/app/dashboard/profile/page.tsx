'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronRight, User, Shield, Key, HelpCircle, ArrowRight, Camera,
  Hash, Mail, Calendar, Phone, MapPin, Info, Loader2, X, Upload,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pinForm, setPinForm] = useState({
    newPin: '',
    currentPassword: '',
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        toast.error('Image must be less than 4MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoPreview) return;

    setIsUploadingPhoto(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/profile/photo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photo: photoPreview }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Profile photo updated successfully!');
        setShowPhotoModal(false);
        setPhotoPreview(null);
        refreshUser?.();
      } else {
        toast.error(data.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An error occurred');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pinForm.newPin || !pinForm.currentPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (pinForm.newPin.length < 4) {
      toast.error('PIN must be at least 4 characters');
      return;
    }

    setIsChangingPin(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/profile/pin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newPin: pinForm.newPin,
          currentPassword: pinForm.currentPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Transaction PIN updated successfully!');
        setShowPinModal(false);
        setPinForm({ newPin: '', currentPassword: '' });
      } else {
        toast.error(data.error || 'Failed to update PIN');
      }
    } catch (error) {
      console.error('PIN change error:', error);
      toast.error('An error occurred');
    } finally {
      setIsChangingPin(false);
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ color: "white" }}>Account Settings</h1>
        <div className="flex items-center text-sm mt-1">
          <Link href="/dashboard" className="text-gray-500 hover:text-blue-400">Dashboard</Link>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
          <span className="text-gray-300">Settings</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-4">
          <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden mb-6">
            {/* Profile Header */}
            <div className="relative bg-gradient-to-r from-[#004B87] to-blue-700 px-6 py-8 flex flex-col items-center">
              {/* Profile Photo */}
              <div className="relative mb-3">
                <div className="h-24 w-24 rounded-full border-4 border-white/30 overflow-hidden bg-gray-700 shadow-lg">
                  {user?.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-white bg-blue-600">
                      {getInitials(user?.name || '')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <Camera className="h-4 w-4 text-blue-600" />
                </button>
              </div>

              <h2 className="text-xl font-bold text-white" style={{ color: "white" }}>{user?.name}</h2>
              <p className="text-white/80 text-sm">Account #{user?.accountNumber}</p>
            </div>

            {/* Navigation Menu */}
            <div className="p-4">
              <nav className="space-y-1">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center px-4 py-3 rounded-lg bg-blue-500/10 text-white font-medium"
                >
                  <User className="h-5 w-5 mr-3 text-blue-400" />
                  <span style={{ color: "white" }}>Profile Information</span>
                </Link>

                <Link
                  href="/dashboard/profile/security"
                  className="flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 font-medium"
                >
                  <Shield className="h-5 w-5 mr-3 text-gray-500" />
                  <span>Security Settings</span>
                </Link>

                <button
                  onClick={() => setShowPinModal(true)}
                  className="w-full flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 font-medium text-left"
                >
                  <Key className="h-5 w-5 mr-3 text-gray-500" />
                  <span>Transaction PIN</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-[#111111] rounded-xl border border-gray-800 p-5">
            <div className="flex items-center mb-4">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                <HelpCircle className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white" style={{ color: "white" }}>Need Help?</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Contact our support team if you need assistance with your account settings.
            </p>
            <Link
              href="/dashboard/support"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              Contact Support <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>

        {/* Right Column - Profile Info */}
        <div className="lg:col-span-8">
          <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
            <div className="border-b border-gray-800 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center" style={{ color: "white" }}>
                <User className="h-5 w-5 mr-2 text-blue-400" />
                Profile Information
              </h2>
              <p className="text-sm text-gray-500 mt-1">Your personal information and account details</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={user?.name || ''}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                </div>


              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Account Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={user?.accountNumber || ''}
                    readOnly
                    className="w-full pl-10 pr-12 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user?.accountNumber || '');
                      toast.success('Account number copied!');
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-blue-400"
                  >
                    <Hash className="h-5 w-5" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">This is your unique account identifier</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Date of Birth</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not set'}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={user?.phone || 'Not set'}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Address</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-500" />
                  </div>
                  <textarea
                    value={user?.address || 'Not set'}
                    readOnly
                    rows={2}
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white resize-none"
                  />
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex">
                  <Info className="h-5 w-5 text-blue-400 shrink-0" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-white" style={{ color: "white" }}>Account Information</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      To update your personal information, please contact our customer support team with your request.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Upload Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowPhotoModal(false)} />
          <div className="relative bg-[#111111] rounded-xl border border-gray-800 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-white" style={{ color: "white" }}>Upload Profile Picture</h3>
              <button onClick={() => { setShowPhotoModal(false); setPhotoPreview(null); }} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Select New Profile Picture</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-[#0a0a0a] hover:bg-gray-900 overflow-hidden"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-5">
                      <Upload className="h-10 w-10 text-gray-500 mb-2" />
                      <p className="text-sm text-gray-400"><span className="font-semibold">Click to upload</span></p>
                      <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 4MB)</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <button
                onClick={handlePhotoUpload}
                disabled={!photoPreview || isUploadingPhoto}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium flex items-center justify-center"
              >
                {isUploadingPhoto ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Uploading...</>
                ) : (
                  <><Upload className="h-5 w-5 mr-2" /> Upload Profile Picture</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Change Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowPinModal(false)} />
          <div className="relative bg-[#111111] rounded-xl border border-gray-800 w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-white" style={{ color: "white" }}>Change Transaction PIN</h3>
              <button onClick={() => setShowPinModal(false)} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePinChange} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">New Transaction PIN</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={pinForm.newPin}
                    onChange={(e) => setPinForm(prev => ({ ...prev, newPin: e.target.value }))}
                    placeholder="Enter new PIN"
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Create a secure PIN that you can remember</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={pinForm.currentPassword}
                    onChange={(e) => setPinForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">For security verification</p>
              </div>

              {/* Security Notice */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex">
                  <Info className="h-5 w-5 text-yellow-400 shrink-0" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-yellow-400">Security Alert</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Keep your transaction PIN confidential. Never share your PIN with anyone.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isChangingPin}
                className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium flex items-center justify-center"
              >
                {isChangingPin ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Updating...</>
                ) : (
                  <><Key className="h-5 w-5 mr-2" /> Update Transaction PIN</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
