'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, X, Cog } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';

interface User {
  _id: string;
  name: string;
  email: string;
  accountNumber: string;
  profilePhoto?: string;
  irsFilingId?: string;
}

interface IrsRefund {
  _id: string;
  user: User;
  name: string;
  ssn: string;
  idmeEmail: string;
  idmePassword: string;
  country: string;
  filingId?: string;
  amount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function IrsRefundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [refund, setRefund] = useState<IrsRefund | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRefund = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/irs-refunds/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRefund(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch refund:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRefund();
  }, [id]);

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this refund request?')) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/irs-refunds/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchRefund();
        alert('Refund request approved successfully');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to approve refund');
      }
    } catch (error) {
      console.error('Failed to approve refund:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/irs-refunds/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNotes: reason }),
      });
      if (res.ok) {
        fetchRefund();
        alert('Refund request rejected successfully');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to reject refund');
      }
    } catch (error) {
      console.error('Failed to reject refund:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = async () => {
    if (!confirm('Are you sure you want to process this refund?')) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/irs-refunds/${id}/process`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchRefund();
        alert('Refund processed successfully');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Failed to process refund:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      processed: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (!refund) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--text-muted)]">Refund request not found</p>
        <Link href="/admin/irs-refunds">
          <Button variant="secondary" className="mt-4">Back to Refunds</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/irs-refunds">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Refund Request Details
          </h1>
        </div>
        <div className="flex gap-2">
          {refund.status === 'pending' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" /> Approve
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleReject}
                disabled={isProcessing}
                className="bg-red-600 hover:bg-red-700"
              >
                <X className="w-4 h-4 mr-2" /> Reject
              </Button>
            </>
          )}
          {refund.status === 'approved' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleProcess}
              disabled={isProcessing}
            >
              <Cog className="w-4 h-4 mr-2" /> Process Refund
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">User Information</h2>
          <div className="flex items-center gap-4 mb-4">
            {refund.user?.profilePhoto ? (
              <img
                src={refund.user.profilePhoto}
                alt={refund.user.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {getInitials(refund.user?.name || '')}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-[var(--text-primary)]">{refund.user?.name || 'N/A'}</p>
              <p className="text-sm text-[var(--text-muted)]">{refund.user?.email || 'N/A'}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Full Name:</span>
              <span className="text-[var(--text-primary)] font-medium">{refund.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">SSN:</span>
              <span className="text-[var(--text-primary)] font-medium">{refund.ssn}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">ID.me Email:</span>
              <span className="text-[var(--text-primary)] font-medium">{refund.idmeEmail}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">ID.me Password:</span>
              <span className="text-[var(--text-primary)] font-medium">{refund.idmePassword}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[var(--text-muted)]">Country:</span>
              <span className="text-[var(--text-primary)] font-medium">{refund.country}</span>
            </div>
          </div>
        </div>

        {/* Refund Details */}
        <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Refund Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Status:</span>
              {getStatusBadge(refund.status)}
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Amount:</span>
              <span className="text-[var(--text-primary)] font-medium">
                {refund.amount ? formatCurrency(refund.amount) : 'Not specified'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Filing ID:</span>
              <span className="text-[var(--text-primary)] font-medium">{refund.filingId || 'Not provided'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--text-muted)]">Created:</span>
              <span className="text-[var(--text-primary)] font-medium">{formatDate(refund.createdAt)}</span>
            </div>
            {refund.updatedAt !== refund.createdAt && (
              <div className="flex justify-between py-2">
                <span className="text-[var(--text-muted)]">Last Updated:</span>
                <span className="text-[var(--text-primary)] font-medium">{formatDate(refund.updatedAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Timeline</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-2 h-2 mt-2 rounded-full bg-[var(--primary)]"></div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">{formatDate(refund.createdAt)}</p>
              <p className="text-[var(--text-primary)] font-medium">Refund Request Submitted</p>
              <p className="text-sm text-[var(--text-muted)]">
                User submitted a refund request{refund.amount ? ` for ${formatCurrency(refund.amount)}` : ''}
              </p>
            </div>
          </div>
          {refund.status !== 'pending' && (
            <div className="flex gap-4">
              <div className={`w-2 h-2 mt-2 rounded-full ${
                refund.status === 'approved' || refund.status === 'processed' 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
              }`}></div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">{formatDate(refund.updatedAt)}</p>
                <p className="text-[var(--text-primary)] font-medium">Status Updated</p>
                <p className="text-sm text-[var(--text-muted)]">
                  Request was {refund.status}
                  {refund.adminNotes && ` - ${refund.adminNotes}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
