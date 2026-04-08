'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, Eye, Download, Clock, Edit, Trash2 } from 'lucide-react';
import {
  Button, Input, Select, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
  StatusBadge, Pagination, PageInfo, Modal, ConfirmDialog,
} from '@/components/ui';

interface Transfer {
  _id: string;
  user: { _id: string; name: string; email: string; accountNumber: string };
  type: string;
  amount: number;
  status: string;
  reference: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  source?: 'admin' | 'user';
  fee?: number;
  totalAmount?: number;
  recipient?: { _id: string; name: string; email: string; accountNumber: string };
  recipientDetails?: { accountNumber: string; accountName: string; bankName?: string };
  transferType?: string;
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Transfer | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showView, setShowView] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ amount: 0, status: '', description: '', balanceBefore: 0, balanceAfter: 0, fee: 0, createdAt: '' });
  const [showDelete, setShowDelete] = useState(false);

  const limit = 10;

  useEffect(() => { fetchData(); }, [currentPage, statusFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({ page: currentPage.toString(), limit: limit.toString() });
      if (statusFilter) params.append('status', statusFilter);

      const res = await fetch(`/api/admin/transfers?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setTransfers(data.data || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject' | 'processing') => {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/transfers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transferId: selected._id, action, reason: rejectReason }),
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
      const res = await fetch('/api/admin/transfers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transferId: selected._id, action: 'edit', source: selected.source, editData: editForm }),
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

  const openEditModal = (t: Transfer) => {
    setSelected(t);
    setEditForm({
      amount: t.amount,
      status: t.status,
      description: t.description || '',
      balanceBefore: t.balanceBefore || 0,
      balanceAfter: t.balanceAfter || 0,
      fee: t.fee || 0,
      createdAt: new Date(t.createdAt).toISOString().slice(0, 16),
    });
    setShowEdit(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/transfers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transferId: selected._id, action: 'delete', source: selected.source }),
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
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Transfers</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage and process transfer requests</p>
        </div>
        <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />}>Export</Button>
      </div>

      <Card>
        <form onSubmit={(e) => { e.preventDefault(); setCurrentPage(1); fetchData(); }} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input placeholder="Search by reference..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} leftIcon={<Search className="w-4 h-4" />} />
          </div>
          <Select
            options={[{ value: '', label: 'All Status' }, { value: 'pending', label: 'Pending' }, { value: 'processing', label: 'Processing' }, { value: 'completed', label: 'Completed' }, { value: 'failed', label: 'Failed' }]}
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
          ) : transfers.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No transfers found</div>
          ) : (
            transfers.map((t) => (
              <div key={t._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">{t.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{t.user?.email}</p>
                    <p className="text-xs font-mono text-[var(--text-muted)] truncate">{t.reference}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text-primary)] text-base">{formatCurrency(t.amount)}</span>
                    <span className="text-xs capitalize text-[var(--text-muted)]">{t.type.replace('_', ' ')}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{formatDate(t.createdAt)}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => { setSelected(t); setShowView(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-[var(--bg)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--border)] transition-colors">
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button onClick={() => openEditModal(t)} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-[var(--primary-light)] text-[var(--primary)] font-medium text-sm hover:opacity-80 transition-colors">
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  {t.status === 'pending' && (
                    <>
                      <button onClick={() => { setSelected(t); handleAction('processing'); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-yellow-50 text-yellow-700 font-medium text-sm hover:bg-yellow-100 transition-colors">
                        <Clock className="w-4 h-4" /> Processing
                      </button>
                      <button onClick={() => { setSelected(t); setShowApprove(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-green-50 text-green-700 font-medium text-sm hover:bg-green-100 transition-colors">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => { setSelected(t); setShowReject(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-red-50 text-red-700 font-medium text-sm hover:bg-red-100 transition-colors">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  {t.status === 'processing' && (
                    <>
                      <button onClick={() => { setSelected(t); setShowApprove(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-green-50 text-green-700 font-medium text-sm hover:bg-green-100 transition-colors">
                        <CheckCircle className="w-4 h-4" /> Complete
                      </button>
                      <button onClick={() => { setSelected(t); setShowReject(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-red-50 text-red-700 font-medium text-sm hover:bg-red-100 transition-colors">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => { setSelected(t); setShowDelete(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 transition-colors ml-auto">
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
                <TableHead>Type</TableHead>
                <TableHead align="right">Amount</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={8}><div className="h-12 bg-[var(--bg)] rounded animate-pulse" /></TableCell></TableRow>)
              ) : transfers.length === 0 ? (
                <TableEmpty message="No transfers found" colSpan={8} />
              ) : (
                transfers.map((t) => (
                  <TableRow key={t._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{t.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-[var(--text-muted)]">{t.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell><span className="font-mono text-sm">{t.reference}</span></TableCell>
                    <TableCell><span className="capitalize text-sm">{t.type.replace('_', ' ')}</span></TableCell>
                    <TableCell align="right"><span className="font-semibold">{formatCurrency(t.amount)}</span></TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${t.source === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {t.source === 'user' ? 'User Request' : 'Admin'}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell><span className="text-sm text-[var(--text-secondary)]">{formatDate(t.createdAt)}</span></TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setSelected(t); setShowView(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg)] text-[var(--text-secondary)]" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEditModal(t)} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--primary-light)] text-[var(--primary)]" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { setSelected(t); setShowDelete(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error-light)] text-[var(--error)]" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        {t.status === 'pending' && (
                          <>
                            <button onClick={() => { setSelected(t); handleAction('processing'); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--warning-light)] text-[var(--warning)]" title="Mark Processing"><Clock className="w-4 h-4" /></button>
                            <button onClick={() => { setSelected(t); setShowApprove(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--success-light)] text-[var(--success)]" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => { setSelected(t); setShowReject(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error-light)] text-[var(--error)]" title="Reject"><XCircle className="w-4 h-4" /></button>
                          </>
                        )}
                        {t.status === 'processing' && (
                          <>
                            <button onClick={() => { setSelected(t); setShowApprove(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--success-light)] text-[var(--success)]" title="Complete"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => { setSelected(t); setShowReject(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error-light)] text-[var(--error)]" title="Reject"><XCircle className="w-4 h-4" /></button>
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

      <Modal isOpen={showView} onClose={() => { setShowView(false); setSelected(null); }} title="Transfer Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-[var(--text-muted)]">Reference</p><p className="font-mono text-sm">{selected.reference}</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Status</p><StatusBadge status={selected.status} /></div>
              <div><p className="text-sm text-[var(--text-muted)]">Type</p><p className="capitalize">{(selected.transferType || selected.type).replace('_', ' ')}</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Amount</p><p className="font-semibold">{formatCurrency(selected.amount)}</p></div>
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
                  {selected.totalAmount !== undefined && <div><p className="text-sm text-[var(--text-muted)]">Total</p><p className="font-semibold">{formatCurrency(selected.totalAmount)}</p></div>}
                </>
              )}
              <div><p className="text-sm text-[var(--text-muted)]">User</p><p>{selected.user?.name}</p><p className="text-xs text-[var(--text-muted)]">{selected.user?.email}</p></div>
              <div><p className="text-sm text-[var(--text-muted)]">Date</p><p>{formatDate(selected.createdAt)}</p></div>
              <div className="col-span-2"><p className="text-sm text-[var(--text-muted)]">Description</p><p>{selected.description}</p></div>
            </div>
            {selected.source === 'user' && selected.recipientDetails && (
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Recipient</p>
                <p>{selected.recipientDetails.accountName}</p>
                <p className="text-sm text-[var(--text-muted)]">{selected.recipientDetails.accountNumber}</p>
                {selected.recipientDetails.bankName && <p className="text-sm text-[var(--text-muted)]">{selected.recipientDetails.bankName}</p>}
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={showApprove} onClose={() => { setShowApprove(false); setSelected(null); }} onConfirm={() => handleAction('approve')} title="Complete Transfer" message={`Complete transfer of ${selected ? formatCurrency(selected.amount) : ''}?`} confirmText="Complete" variant="primary" isLoading={isProcessing} />

      <Modal isOpen={showReject} onClose={() => { setShowReject(false); setSelected(null); setRejectReason(''); }} title="Reject Transfer" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Reject transfer of <span className="font-semibold">{selected ? formatCurrency(selected.amount) : ''}</span>? Amount will be refunded to sender.</p>
          <Input label="Reason (optional)" placeholder="Enter reason..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowReject(false); setSelected(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={() => handleAction('reject')} isLoading={isProcessing}>Reject</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setSelected(null); }} title="Edit Transfer" size="md">
        {selected && (
          <div className="space-y-4">
            <Input label="Amount" type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })} />
            <Select
              label="Status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'processing', label: 'Processing' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
              ]}
            />
            <Input label="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            {selected.source === 'admin' && (
              <>
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
        title="Delete Transfer"
        message={`Are you sure you want to delete this transfer of ${selected ? formatCurrency(selected.amount) : ''}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isProcessing}
      />
    </div>
  );
}
