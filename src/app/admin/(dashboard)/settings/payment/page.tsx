'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Bitcoin, Building2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface PaymentMethod {
  _id: string;
  name: string;
  type: 'bank' | 'crypto' | 'paypal' | 'card' | 'mobile_money';
  details: Record<string, string>;
  instructions?: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  feeType: 'fixed' | 'percentage';
  status: 'active' | 'inactive';
  createdAt: string;
}

const defaultBitcoinDetails = {
  walletAddress: '',
  network: 'BTC',
};

const defaultPaypalDetails = {
  email: '',
};

const defaultBankDetails = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  routingNumber: '',
  swiftCode: '',
};

export default function PaymentSettingsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    type: 'crypto' as 'bank' | 'crypto' | 'paypal',
    details: {} as Record<string, string>,
    instructions: '',
    minAmount: 10,
    maxAmount: 100000,
    fee: 0,
    feeType: 'fixed' as 'fixed' | 'percentage',
    status: 'active' as 'active' | 'inactive',
  });

  const fetchMethods = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/payment-methods', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMethods(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'crypto',
      details: {},
      instructions: '',
      minAmount: 10,
      maxAmount: 100000,
      fee: 0,
      feeType: 'fixed',
      status: 'active',
    });
    setSelectedMethod(null);
  };

  const openAddModal = (type: 'crypto' | 'paypal' | 'bank') => {
    resetForm();
    let defaultDetails = {};
    let defaultName = '';
    
    if (type === 'crypto') {
      defaultDetails = { ...defaultBitcoinDetails };
      defaultName = 'Bitcoin';
    } else if (type === 'paypal') {
      defaultDetails = { ...defaultPaypalDetails };
      defaultName = 'PayPal';
    } else if (type === 'bank') {
      defaultDetails = { ...defaultBankDetails };
      defaultName = 'Bank Transfer';
    }
    
    setFormData(prev => ({
      ...prev,
      type,
      name: defaultName,
      details: defaultDetails,
    }));
    setShowModal(true);
  };

  const openEditModal = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setFormData({
      name: method.name,
      type: method.type as 'bank' | 'crypto' | 'paypal',
      details: method.details || {},
      instructions: method.instructions || '',
      minAmount: method.minAmount,
      maxAmount: method.maxAmount,
      fee: method.fee,
      feeType: method.feeType,
      status: method.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('adminToken');
      const url = selectedMethod 
        ? `/api/admin/payment-methods/${selectedMethod._id}`
        : '/api/admin/payment-methods';
      
      const res = await fetch(url, {
        method: selectedMethod ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: selectedMethod ? 'Payment method updated!' : 'Payment method created!' });
        setShowModal(false);
        resetForm();
        fetchMethods();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save payment method' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save payment method' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMethod) return;
    setIsProcessing(true);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/payment-methods/${selectedMethod._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Payment method deleted!' });
        setShowDeleteModal(false);
        setSelectedMethod(null);
        fetchMethods();
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to delete' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete payment method' });
    } finally {
      setIsProcessing(false);
    }
  };

  const updateDetails = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      details: { ...prev.details, [key]: value },
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'crypto':
        return <Bitcoin className="w-5 h-5 text-orange-500" />;
      case 'paypal':
        return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'bank':
        return <Building2 className="w-5 h-5 text-green-600" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>
      : <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Inactive</span>;
  };

  // Group methods by type
  const bitcoinMethods = methods.filter(m => m.type === 'crypto');
  const paypalMethods = methods.filter(m => m.type === 'paypal');
  const bankMethods = methods.filter(m => m.type === 'bank');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Payment Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Configure deposit payment methods for users</p>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-[var(--surface)] border border-[var(--border)] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Bitcoin Section */}
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Bitcoin className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Bitcoin / Crypto</h2>
                  <p className="text-sm text-[var(--text-muted)]">Accept cryptocurrency deposits</p>
                </div>
              </div>
              <Button size="sm" onClick={() => openAddModal('crypto')}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {bitcoinMethods.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">No crypto payment methods configured</p>
            ) : (
              <div className="space-y-3">
                {bitcoinMethods.map(method => (
                  <div key={method._id} className="flex items-center justify-between p-4 bg-[var(--bg)] rounded-lg">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{method.name}</p>
                      <p className="text-sm text-[var(--text-muted)]">
                        Wallet: {method.details?.walletAddress || 'Not set'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(method.status)}
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(method)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedMethod(method); setShowDeleteModal(true); }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PayPal Section */}
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">PayPal</h2>
                  <p className="text-sm text-[var(--text-muted)]">Accept PayPal deposits</p>
                </div>
              </div>
              <Button size="sm" onClick={() => openAddModal('paypal')}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {paypalMethods.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">No PayPal payment methods configured</p>
            ) : (
              <div className="space-y-3">
                {paypalMethods.map(method => (
                  <div key={method._id} className="flex items-center justify-between p-4 bg-[var(--bg)] rounded-lg">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{method.name}</p>
                      <p className="text-sm text-[var(--text-muted)]">
                        Email: {method.details?.email || 'Not set'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(method.status)}
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(method)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedMethod(method); setShowDeleteModal(true); }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bank Transfer Section */}
          <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Bank Transfer</h2>
                  <p className="text-sm text-[var(--text-muted)]">Accept bank wire transfers</p>
                </div>
              </div>
              <Button size="sm" onClick={() => openAddModal('bank')}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            {bankMethods.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-4 text-center">No bank transfer methods configured</p>
            ) : (
              <div className="space-y-3">
                {bankMethods.map(method => (
                  <div key={method._id} className="flex items-center justify-between p-4 bg-[var(--bg)] rounded-lg">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{method.name}</p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {method.details?.bankName || 'Bank not set'} - {method.details?.accountNumber || 'Account not set'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(method.status)}
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(method)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedMethod(method); setShowDeleteModal(true); }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={selectedMethod ? 'Edit Payment Method' : 'Add Payment Method'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Bitcoin, PayPal Business"
            required
          />

          {/* Type-specific fields */}
          {formData.type === 'crypto' && (
            <>
              <Input
                label="Wallet Address"
                value={formData.details.walletAddress || ''}
                onChange={(e) => updateDetails('walletAddress', e.target.value)}
                placeholder="Enter your crypto wallet address"
                required
              />
              <Input
                label="Network"
                value={formData.details.network || ''}
                onChange={(e) => updateDetails('network', e.target.value)}
                placeholder="e.g., BTC, ERC20, TRC20"
              />
            </>
          )}

          {formData.type === 'paypal' && (
            <Input
              label="PayPal Email"
              type="email"
              value={formData.details.email || ''}
              onChange={(e) => updateDetails('email', e.target.value)}
              placeholder="your-paypal@email.com"
              required
            />
          )}

          {formData.type === 'bank' && (
            <>
              <Input
                label="Bank Name"
                value={formData.details.bankName || ''}
                onChange={(e) => updateDetails('bankName', e.target.value)}
                placeholder="e.g., Chase Bank"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Account Name"
                  value={formData.details.accountName || ''}
                  onChange={(e) => updateDetails('accountName', e.target.value)}
                  placeholder="Account holder name"
                  required
                />
                <Input
                  label="Account Number"
                  value={formData.details.accountNumber || ''}
                  onChange={(e) => updateDetails('accountNumber', e.target.value)}
                  placeholder="Account number"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Routing Number"
                  value={formData.details.routingNumber || ''}
                  onChange={(e) => updateDetails('routingNumber', e.target.value)}
                  placeholder="Routing number"
                />
                <Input
                  label="SWIFT Code"
                  value={formData.details.swiftCode || ''}
                  onChange={(e) => updateDetails('swiftCode', e.target.value)}
                  placeholder="SWIFT/BIC code"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Instructions</label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)]"
              placeholder="Instructions for users when making deposits..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Amount ($)"
              type="number"
              value={formData.minAmount}
              onChange={(e) => setFormData({ ...formData, minAmount: parseFloat(e.target.value) })}
              min="0"
            />
            <Input
              label="Max Amount ($)"
              type="number"
              value={formData.maxAmount}
              onChange={(e) => setFormData({ ...formData, maxAmount: parseFloat(e.target.value) })}
              min="0"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fee"
              type="number"
              value={formData.fee}
              onChange={(e) => setFormData({ ...formData, fee: parseFloat(e.target.value) })}
              min="0"
              step="0.01"
            />
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Fee Type</label>
              <select
                value={formData.feeType}
                onChange={(e) => setFormData({ ...formData, feeType: e.target.value as 'fixed' | 'percentage' })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)]"
              >
                <option value="fixed">Fixed ($)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isProcessing}>
              {selectedMethod ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedMethod(null); }}
        title="Delete Payment Method"
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            Are you sure you want to delete <strong>{selectedMethod?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => { setShowDeleteModal(false); setSelectedMethod(null); }}>
              Cancel
            </Button>
            <Button onClick={handleDelete} isLoading={isProcessing} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
