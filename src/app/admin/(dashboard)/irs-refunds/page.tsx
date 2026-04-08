'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Check, X, Cog, Trash2, Settings, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';

interface User {
  _id: string;
  name: string;
  email: string;
  accountNumber: string;
  profilePhoto?: string;
}

interface IrsRefund {
  _id: string;
  user: User;
  name: string;
  ssn: string;
  idmeEmail: string;
  country: string;
  filingId?: string;
  amount?: number;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function IrsRefundsPage() {
  const [refunds, setRefunds] = useState<IrsRefund[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<IrsRefund | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRefunds = async (page = 1) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/admin/irs-refunds?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setRefunds(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this refund request?')) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/irs-refunds/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchRefunds(pagination.page);
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

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/irs-refunds/${id}/reject`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ adminNotes: reason }),
      });
      if (res.ok) {
        fetchRefunds(pagination.page);
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

  const handleProcess = async (id: string) => {
    if (!confirm('Are you sure you want to process this refund?')) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/irs-refunds/${id}/process`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchRefunds(pagination.page);
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

  const handleDelete = async () => {
    if (!selectedRefund) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/irs-refunds/${selectedRefund._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setSelectedRefund(null);
        fetchRefunds(pagination.page);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete refund');
      }
    } catch (error) {
      console.error('Failed to delete refund:', error);
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
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">IRS Refund Management</h1>
          <p className="text-sm text-[var(--text-muted)]">Manage IRS refund requests from users</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/irs-refunds?status=pending">
            <Button variant="secondary" size="sm">
              <Clock className="w-4 h-4 mr-2" /> Pending Requests
            </Button>
          </Link>
          <Link href="/admin/irs-refunds/settings">
            <Button variant="secondary" size="sm">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--text-primary)]"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="processed">Processed</option>
        </select>
      </div>

      {/* Table / Cards */}
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden">
        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-[var(--border)]">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="p-4"><div className="h-20 bg-[var(--bg)] rounded animate-pulse" /></div>
            ))
          ) : refunds.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No refund requests found.</div>
          ) : (
            refunds.map((refund) => (
              <div key={refund._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {refund.user?.profilePhoto ? (
                      <img src={refund.user.profilePhoto} alt={refund.user.name} className="w-9 h-9 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 shrink-0 rounded-full bg-[var(--primary)] flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{getInitials(refund.user?.name || '')}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--text-primary)] truncate">{refund.user?.name || 'N/A'}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{refund.user?.email || 'N/A'}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate">{refund.name}</p>
                    </div>
                  </div>
                  {getStatusBadge(refund.status)}
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    {refund.amount && <span className="font-semibold text-sm text-[var(--text-primary)]">{formatCurrency(refund.amount)}</span>}
                    {refund.filingId && <span className="font-mono">{refund.filingId}</span>}
                  </div>
                  <span>{formatDate(refund.createdAt)}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link href={`/admin/irs-refunds/${refund._id}`}>
                    <button className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-[var(--bg)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--border)] transition-colors">
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </Link>
                  {refund.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(refund._id)} disabled={isProcessing} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-green-50 text-green-700 font-medium text-sm hover:bg-green-100 transition-colors disabled:opacity-50">
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => handleReject(refund._id)} disabled={isProcessing} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-red-50 text-red-700 font-medium text-sm hover:bg-red-100 transition-colors disabled:opacity-50">
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  {refund.status === 'approved' && (
                    <button onClick={() => handleProcess(refund._id)} disabled={isProcessing} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-blue-50 text-blue-700 font-medium text-sm hover:bg-blue-100 transition-colors disabled:opacity-50">
                      <Cog className="w-4 h-4" /> Process Refund
                    </button>
                  )}
                  <button onClick={() => { setSelectedRefund(refund); setShowDeleteModal(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 transition-colors ml-auto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Filing ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">Loading...</td></tr>
              ) : refunds.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--text-muted)]">No refund requests found.</td></tr>
              ) : (
                refunds.map((refund) => (
                  <tr key={refund._id} className="hover:bg-[var(--bg)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {refund.user?.profilePhoto ? (
                          <img src={refund.user.profilePhoto} alt={refund.user.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{getInitials(refund.user?.name || '')}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{refund.user?.name || 'N/A'}</p>
                          <p className="text-xs text-[var(--text-muted)]">{refund.user?.email || 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{refund.name}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{refund.filingId || '-'}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{refund.amount ? formatCurrency(refund.amount) : '-'}</td>
                    <td className="px-4 py-3">{getStatusBadge(refund.status)}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{formatDate(refund.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link href={`/admin/irs-refunds/${refund._id}`}>
                          <Button variant="ghost" size="sm" title="View Details"><Eye className="w-4 h-4" /></Button>
                        </Link>
                        {refund.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleApprove(refund._id)} disabled={isProcessing} title="Approve" className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleReject(refund._id)} disabled={isProcessing} title="Reject" className="text-red-600 hover:text-red-700"><X className="w-4 h-4" /></Button>
                          </>
                        )}
                        {refund.status === 'approved' && (
                          <Button variant="ghost" size="sm" onClick={() => handleProcess(refund._id)} disabled={isProcessing} title="Process Refund" className="text-blue-600 hover:text-blue-700"><Cog className="w-4 h-4" /></Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedRefund(refund); setShowDeleteModal(true); }} title="Delete" className="text-red-600 hover:text-red-700"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-[var(--border)] flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => fetchRefunds(pagination.page - 1)} disabled={pagination.page === 1}>Previous</Button>
              <Button variant="secondary" size="sm" onClick={() => fetchRefunds(pagination.page + 1)} disabled={pagination.page === pagination.totalPages}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedRefund(null);
        }}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            Are you sure you want to delete this refund request? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedRefund(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              isLoading={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
