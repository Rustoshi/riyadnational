'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import {
  Button, Input, Select, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
  StatusBadge, Pagination, PageInfo, Modal, ConfirmDialog,
} from '@/components/ui';

interface KycApplication {
  _id: string;
  user: { _id: string; name: string; email: string };
  documentType: string;
  documentNumber: string;
  frontImage?: string;
  backImage?: string;
  selfieImage?: string;
  status: string;
  adminNote?: string;
  createdAt: string;
}

export default function KycPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [applications, setApplications] = useState<KycApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selected, setSelected] = useState<KycApplication | null>(null);
  const [showView, setShowView] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const limit = 10;

  useEffect(() => { fetchData(); }, [currentPage, statusFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page: currentPage.toString(), limit: limit.toString() });
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/admin/kyc?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setApplications(data.data || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/kyc', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ kycId: selected._id, action, reason: rejectReason }),
      });
      if (res.ok) {
        fetchData();
        setShowApprove(false);
        setShowReject(false);
        setSelected(null);
        setRejectReason('');
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">KYC Applications</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Review and process identity verification requests</p>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            options={[{ value: '', label: 'All Status' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-48"
          />
        </div>
      </Card>

      <Card padding="none">
        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-[var(--border)]">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="p-4"><div className="h-20 bg-[var(--bg)] rounded animate-pulse" /></div>
            ))
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No KYC applications found</div>
          ) : (
            applications.map((app) => (
              <div key={app._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">{app.user?.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{app.user?.email}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 capitalize">{app.documentType?.replace('_', ' ')}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span className="font-mono">{app.documentNumber}</span>
                  <span>{formatDate(app.createdAt)}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setSelected(app); setShowView(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-[var(--bg)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--border)] transition-colors">
                    <Eye className="w-4 h-4" /> View Docs
                  </button>
                  {app.status === 'pending' && (
                    <>
                      <button onClick={() => { setSelected(app); setShowApprove(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-green-50 text-green-700 font-medium text-sm hover:bg-green-100 transition-colors">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => { setSelected(app); setShowReject(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-red-50 text-red-700 font-medium text-sm hover:bg-red-100 transition-colors">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Document Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={6}><div className="h-12 bg-[var(--bg)] rounded animate-pulse" /></TableCell></TableRow>)
              ) : applications.length === 0 ? (
                <TableEmpty message="No KYC applications found" colSpan={6} />
              ) : (
                applications.map((app) => (
                  <TableRow key={app._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{app.user?.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{app.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell><span className="capitalize">{app.documentType?.replace('_', ' ')}</span></TableCell>
                    <TableCell><span className="font-mono text-sm">{app.documentNumber}</span></TableCell>
                    <TableCell><StatusBadge status={app.status} /></TableCell>
                    <TableCell><span className="text-sm text-[var(--text-secondary)]">{formatDate(app.createdAt)}</span></TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setSelected(app); setShowView(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg)] text-[var(--text-secondary)]" title="View"><Eye className="w-4 h-4" /></button>
                        {app.status === 'pending' && (
                          <>
                            <button onClick={() => { setSelected(app); setShowApprove(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--success-light)] text-[var(--success)]" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => { setSelected(app); setShowReject(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error-light)] text-[var(--error)]" title="Reject"><XCircle className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[var(--border)]">
            <PageInfo currentPage={currentPage} totalPages={totalPages} totalItems={total} itemsPerPage={limit} />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </Card>

      <Modal isOpen={showView} onClose={() => { setShowView(false); setSelected(null); }} title="KYC Application Details" size="lg">
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-[var(--text-muted)]">User</p><p className="font-medium">{selected.user?.name}</p><p className="text-sm text-[var(--text-muted)]">{selected.user?.email}</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Status</p><StatusBadge status={selected.status} /></div>
              <div><p className="text-sm text-[var(--text-muted)]">Document Type</p><p className="capitalize">{selected.documentType?.replace('_', ' ')}</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Document Number</p><p className="font-mono">{selected.documentNumber}</p></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {selected.frontImage && (
                <div><p className="text-sm text-[var(--text-muted)] mb-2">Front Image</p><img src={selected.frontImage} alt="Front" className="w-full rounded-[var(--radius-md)] border border-[var(--border)]" /></div>
              )}
              {selected.backImage && (
                <div><p className="text-sm text-[var(--text-muted)] mb-2">Back Image</p><img src={selected.backImage} alt="Back" className="w-full rounded-[var(--radius-md)] border border-[var(--border)]" /></div>
              )}
              {selected.selfieImage && (
                <div><p className="text-sm text-[var(--text-muted)] mb-2">Selfie</p><img src={selected.selfieImage} alt="Selfie" className="w-full rounded-[var(--radius-md)] border border-[var(--border)]" /></div>
              )}
            </div>
            {selected.status === 'pending' && (
              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <Button variant="danger" onClick={() => { setShowView(false); setShowReject(true); }}>Reject</Button>
                <Button onClick={() => { setShowView(false); setShowApprove(true); }}>Approve</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={showApprove} onClose={() => { setShowApprove(false); setSelected(null); }} onConfirm={() => handleAction('approve')} title="Approve KYC" message={`Approve KYC verification for ${selected?.user?.name}?`} confirmText="Approve" variant="primary" isLoading={isProcessing} />

      <Modal isOpen={showReject} onClose={() => { setShowReject(false); setSelected(null); setRejectReason(''); }} title="Reject KYC" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Reject KYC verification for <span className="font-semibold">{selected?.user?.name}</span>?</p>
          <Input label="Reason" placeholder="Enter rejection reason..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowReject(false); setSelected(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={() => handleAction('reject')} isLoading={isProcessing}>Reject</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
