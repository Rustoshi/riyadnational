'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, CheckCircle, XCircle, Eye, Download, Edit, Trash2 } from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  StatusBadge,
  Pagination,
  PageInfo,
  Modal,
  ConfirmDialog,
} from '@/components/ui';

interface Withdrawal {
  _id: string;
  user: { _id: string; name: string; email: string; accountNumber: string };
  amount: number;
  type: string;
  status: string;
  reference: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  source?: 'admin' | 'user';
  fee?: number;
  netAmount?: number;
  paymentMethod?: { _id: string; name: string; type: string };
  paymentDetails?: Record<string, string>;
}

export default function WithdrawalsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showView, setShowView] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ amount: 0, status: '', description: '', balanceBefore: 0, balanceAfter: 0, fee: 0, createdAt: '' });
  const [showDelete, setShowDelete] = useState(false);

  const limit = 10;

  useEffect(() => {
    fetchData();
  }, [currentPage, statusFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page: currentPage.toString(), limit: limit.toString() });
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/withdrawals?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawals(data.data || []);
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
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ withdrawalId: selected._id, action, reason: rejectReason }),
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

  const handleEdit = async () => {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ withdrawalId: selected._id, action: 'edit', source: selected.source, editData: editForm }),
      });
      if (res.ok) {
        fetchData();
        setShowEdit(false);
        setSelected(null);
      }
    } catch (error) {
      console.error('Edit failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = (w: Withdrawal) => {
    setSelected(w);
    setEditForm({
      amount: w.amount,
      status: w.status,
      description: w.description || '',
      balanceBefore: w.balanceBefore || 0,
      balanceAfter: w.balanceAfter || 0,
      fee: w.fee || 0,
      createdAt: new Date(w.createdAt).toISOString().slice(0, 16),
    });
    setShowEdit(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ withdrawalId: selected._id, action: 'delete', source: selected.source }),
      });
      if (res.ok) {
        fetchData();
        setShowDelete(false);
        setSelected(null);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Withdrawals</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Process user withdrawal requests</p>
        </div>
        <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>Export</Button>
      </div>

      <Card>
        <form onSubmit={(e) => { e.preventDefault(); setCurrentPage(1); fetchData(); }} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
          </div>
          <Select
            options={[{ value: '', label: 'All Status' }, { value: 'pending', label: 'Pending' }, { value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' }]}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-40"
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
      </Card>

      <Card padding="none">
        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-[var(--border)]">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="p-4"><div className="h-20 bg-[var(--bg)] rounded animate-pulse" /></div>
            ))
          ) : withdrawals.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No withdrawals found</div>
          ) : (
            withdrawals.map((w) => (
              <div key={w._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">{w.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{w.user?.email}</p>
                    <p className="text-xs font-mono text-[var(--text-muted)] truncate">{w.reference}</p>
                  </div>
                  <StatusBadge status={w.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[var(--error)] text-base">-{formatCurrency(w.amount)}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${w.source === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {w.source === 'user' ? 'User' : 'Admin'}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{formatDate(w.createdAt)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => { setSelected(w); setShowView(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-[var(--bg)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--border)] transition-colors">
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button onClick={() => openEditModal(w)} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-[var(--primary-light)] text-[var(--primary)] font-medium text-sm hover:opacity-80 transition-colors">
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  {w.status === 'pending' && (
                    <>
                      <button onClick={() => { setSelected(w); setShowApprove(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-green-50 text-green-700 font-medium text-sm hover:bg-green-100 transition-colors">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => { setSelected(w); setShowReject(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-red-50 text-red-700 font-medium text-sm hover:bg-red-100 transition-colors">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => { setSelected(w); setShowDelete(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 transition-colors ml-auto">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                <TableHead>Reference</TableHead>
                <TableHead align="right">Amount</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}><TableCell colSpan={7}><div className="h-12 bg-[var(--bg)] rounded animate-pulse" /></TableCell></TableRow>
                ))
              ) : withdrawals.length === 0 ? (
                <TableEmpty message="No withdrawals found" colSpan={7} />
              ) : (
                withdrawals.map((w) => (
                  <TableRow key={w._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{w.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-[var(--text-muted)]">{w.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell><span className="font-mono text-sm">{w.reference}</span></TableCell>
                    <TableCell align="right"><span className="font-semibold text-[var(--error)]">-{formatCurrency(w.amount)}</span></TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${w.source === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {w.source === 'user' ? 'User Request' : 'Admin'}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={w.status} /></TableCell>
                    <TableCell><span className="text-sm text-[var(--text-secondary)]">{formatDate(w.createdAt)}</span></TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setSelected(w); setShowView(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg)] text-[var(--text-secondary)]" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEditModal(w)} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--primary-light)] text-[var(--primary)]" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { setSelected(w); setShowDelete(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error-light)] text-[var(--error)]" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        {w.status === 'pending' && (
                          <>
                            <button onClick={() => { setSelected(w); setShowApprove(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--success-light)] text-[var(--success)]" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => { setSelected(w); setShowReject(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error-light)] text-[var(--error)]" title="Reject"><XCircle className="w-4 h-4" /></button>
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

      <Modal isOpen={showView} onClose={() => { setShowView(false); setSelected(null); }} title="Withdrawal Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-[var(--text-muted)]">Reference</p><p className="font-mono text-sm">{selected.reference}</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Status</p><StatusBadge status={selected.status} /></div>
              <div><p className="text-sm text-[var(--text-muted)]">Amount</p><p className="font-semibold text-[var(--error)]">{formatCurrency(selected.amount)}</p></div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Source</p>
                <span className={`text-xs px-2 py-1 rounded-full ${selected.source === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                  {selected.source === 'user' ? 'User Request' : 'Admin'}
                </span>
              </div>
              {selected.source === 'admin' && (
                <>
                  <div><p className="text-sm text-[var(--text-muted)]">Balance Before</p><p>{formatCurrency(selected.balanceBefore)}</p></div>
                  <div><p className="text-sm text-[var(--text-muted)]">Balance After</p><p>{formatCurrency(selected.balanceAfter)}</p></div>
                </>
              )}
              {selected.source === 'user' && (
                <>
                  {selected.fee !== undefined && <div><p className="text-sm text-[var(--text-muted)]">Fee</p><p>{formatCurrency(selected.fee)}</p></div>}
                  {selected.netAmount !== undefined && <div><p className="text-sm text-[var(--text-muted)]">Net Amount</p><p className="font-semibold">{formatCurrency(selected.netAmount)}</p></div>}
                  {selected.paymentMethod && <div><p className="text-sm text-[var(--text-muted)]">Payment Method</p><p className="capitalize">{selected.paymentMethod.name}</p></div>}
                </>
              )}
              <div><p className="text-sm text-[var(--text-muted)]">User</p><p>{selected.user?.name}</p><p className="text-xs text-[var(--text-muted)]">{selected.user?.email}</p></div>
              <div className="col-span-2"><p className="text-sm text-[var(--text-muted)]">Description</p><p>{selected.description}</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Date</p><p>{formatDate(selected.createdAt)}</p></div>
            </div>
            {selected.source === 'user' && selected.paymentDetails && Object.keys(selected.paymentDetails).length > 0 && (
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Payment Details</p>
                <div className="space-y-1">
                  {Object.entries(selected.paymentDetails).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-[var(--text-muted)] capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-[var(--text-primary)]">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={showApprove} onClose={() => { setShowApprove(false); setSelected(null); }} onConfirm={() => handleAction('approve')} title="Approve Withdrawal" message={`Approve withdrawal of ${selected ? formatCurrency(selected.amount) : ''}? Funds will be sent to the user.`} confirmText="Approve" variant="primary" isLoading={isProcessing} />

      <Modal isOpen={showReject} onClose={() => { setShowReject(false); setSelected(null); setRejectReason(''); }} title="Reject Withdrawal" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Reject withdrawal of <span className="font-semibold">{selected ? formatCurrency(selected.amount) : ''}</span>? Amount will be refunded.</p>
          <Input label="Reason (optional)" placeholder="Enter reason..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowReject(false); setSelected(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={() => handleAction('reject')} isLoading={isProcessing}>Reject</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setSelected(null); }} title="Edit Withdrawal" size="md">
        {selected && (
          <div className="space-y-4">
            <Input label="Amount" type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })} />
            <Select
              label="Status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
            {selected.source === 'admin' && (
              <>
                <Input label="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                <Input label="Balance Before" type="number" value={editForm.balanceBefore} onChange={(e) => setEditForm({ ...editForm, balanceBefore: parseFloat(e.target.value) || 0 })} />
                <Input label="Balance After" type="number" value={editForm.balanceAfter} onChange={(e) => setEditForm({ ...editForm, balanceAfter: parseFloat(e.target.value) || 0 })} />
              </>
            )}
            {selected.source === 'user' && (
              <Input label="Fee" type="number" value={editForm.fee} onChange={(e) => setEditForm({ ...editForm, fee: parseFloat(e.target.value) || 0 })} />
            )}
            <Input label="Date" type="datetime-local" value={editForm.createdAt} onChange={(e) => setEditForm({ ...editForm, createdAt: e.target.value })} />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => { setShowEdit(false); setSelected(null); }}>Cancel</Button>
              <Button onClick={handleEdit} isLoading={isProcessing}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => { setShowDelete(false); setSelected(null); }}
        onConfirm={handleDelete}
        title="Delete Withdrawal"
        message={`Are you sure you want to delete this withdrawal of ${selected ? formatCurrency(selected.amount) : ''}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isProcessing}
      />
    </div>
  );
}
