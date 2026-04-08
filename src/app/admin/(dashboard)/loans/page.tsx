'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import {
  Button, Input, Select, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
  StatusBadge, Pagination, PageInfo, Modal, ConfirmDialog,
} from '@/components/ui';

interface Loan {
  _id: string;
  user: { _id: string; name: string; email: string };
  amount: number;
  interestRate: number;
  durationMonths: number;
  monthlyPayment: number;
  totalRepayment: number;
  status: string;
  purpose?: string;
  createdAt: string;
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Loan | null>(null);
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

      const res = await fetch(`/api/admin/loans?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setLoans(data.data || []);
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
      const res = await fetch('/api/admin/loans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ loanId: selected._id, action, reason: rejectReason }),
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

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Loan Applications</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Review and process loan requests</p>
      </div>

      <Card>
        <Select
          options={[{ value: '', label: 'All Status' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }, { value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }]}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="w-full sm:w-48"
        />
      </Card>

      <Card padding="none">
        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-[var(--border)]">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="p-4"><div className="h-20 bg-[var(--bg)] rounded animate-pulse" /></div>
            ))
          ) : loans.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No loans found</div>
          ) : (
            loans.map((loan) => (
              <div key={loan._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">{loan.user?.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{loan.user?.email}</p>
                    <p className="text-xs text-[var(--text-muted)]">{formatDate(loan.createdAt)}</p>
                  </div>
                  <StatusBadge status={loan.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center bg-[var(--bg)] rounded-[var(--radius-md)] p-2">
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Amount</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{formatCurrency(loan.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Rate</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{loan.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)]">Monthly</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{formatCurrency(loan.monthlyPayment)}</p>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{loan.durationMonths} months duration</p>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setSelected(loan); setShowView(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-[var(--bg)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--border)] transition-colors">
                    <Eye className="w-4 h-4" /> View Details
                  </button>
                  {loan.status === 'pending' && (
                    <>
                      <button onClick={() => { setSelected(loan); setShowApprove(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-green-50 text-green-700 font-medium text-sm hover:bg-green-100 transition-colors">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => { setSelected(loan); setShowReject(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-red-50 text-red-700 font-medium text-sm hover:bg-red-100 transition-colors">
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
                <TableHead align="right">Amount</TableHead>
                <TableHead align="right">Interest</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead align="right">Monthly</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={8}><div className="h-12 bg-[var(--bg)] rounded animate-pulse" /></TableCell></TableRow>)
              ) : loans.length === 0 ? (
                <TableEmpty message="No loans found" colSpan={8} />
              ) : (
                loans.map((loan) => (
                  <TableRow key={loan._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{loan.user?.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{loan.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell align="right"><span className="font-semibold">{formatCurrency(loan.amount)}</span></TableCell>
                    <TableCell align="right">{loan.interestRate}%</TableCell>
                    <TableCell>{loan.durationMonths} months</TableCell>
                    <TableCell align="right">{formatCurrency(loan.monthlyPayment)}</TableCell>
                    <TableCell><StatusBadge status={loan.status} /></TableCell>
                    <TableCell><span className="text-sm text-[var(--text-secondary)]">{formatDate(loan.createdAt)}</span></TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setSelected(loan); setShowView(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg)] text-[var(--text-secondary)]" title="View"><Eye className="w-4 h-4" /></button>
                        {loan.status === 'pending' && (
                          <>
                            <button onClick={() => { setSelected(loan); setShowApprove(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--success-light)] text-[var(--success)]" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => { setSelected(loan); setShowReject(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error-light)] text-[var(--error)]" title="Reject"><XCircle className="w-4 h-4" /></button>
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

      <Modal isOpen={showView} onClose={() => { setShowView(false); setSelected(null); }} title="Loan Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-[var(--text-muted)]">User</p><p className="font-medium">{selected.user?.name}</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Status</p><StatusBadge status={selected.status} /></div>
              <div><p className="text-sm text-[var(--text-muted)]">Loan Amount</p><p className="font-semibold">{formatCurrency(selected.amount)}</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Interest Rate</p><p>{selected.interestRate}%</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Duration</p><p>{selected.durationMonths} months</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Monthly Payment</p><p>{formatCurrency(selected.monthlyPayment)}</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Total Repayment</p><p className="font-semibold">{formatCurrency(selected.totalRepayment)}</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Applied On</p><p>{formatDate(selected.createdAt)}</p></div>
            </div>
            {selected.purpose && (
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--text-muted)]">Purpose</p>
                <p>{selected.purpose}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={showApprove} onClose={() => { setShowApprove(false); setSelected(null); }} onConfirm={() => handleAction('approve')} title="Approve Loan" message={`Approve loan of ${selected ? formatCurrency(selected.amount) : ''} for ${selected?.user?.name}?`} confirmText="Approve" variant="primary" isLoading={isProcessing} />

      <Modal isOpen={showReject} onClose={() => { setShowReject(false); setSelected(null); setRejectReason(''); }} title="Reject Loan" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Reject loan application of <span className="font-semibold">{selected ? formatCurrency(selected.amount) : ''}</span>?</p>
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
