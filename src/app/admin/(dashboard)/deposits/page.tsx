'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
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

interface Deposit {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    accountNumber: string;
  };
  amount: number;
  type: string;
  status: string;
  reference: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  source?: 'admin' | 'user';
  paymentMethod?: { _id: string; name: string; type: string };
  proofImage?: string;
}

export default function DepositsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ amount: 0, status: '', description: '', balanceBefore: 0, balanceAfter: 0, createdAt: '' });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const limit = 10;

  useEffect(() => {
    fetchDeposits();
  }, [currentPage, statusFilter]);

  const fetchDeposits = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/deposits?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setDeposits(data.data || []);
        setTotalDeposits(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch deposits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDeposits();
  };

  const handleApprove = async () => {
    if (!selectedDeposit) return;
    setIsProcessing(true);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/deposits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          depositId: selectedDeposit._id,
          action: 'approve',
          source: selectedDeposit.source,
        }),
      });

      if (res.ok) {
        fetchDeposits();
        setShowApproveDialog(false);
        setSelectedDeposit(null);
      }
    } catch (error) {
      console.error('Approve failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDeposit) return;
    setIsProcessing(true);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/deposits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          depositId: selectedDeposit._id,
          action: 'reject',
          source: selectedDeposit.source,
          adminNote: rejectReason,
        }),
      });

      if (res.ok) {
        fetchDeposits();
        setShowRejectDialog(false);
        setSelectedDeposit(null);
        setRejectReason('');
      }
    } catch (error) {
      console.error('Reject failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedDeposit) return;
    setIsProcessing(true);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/deposits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          depositId: selectedDeposit._id,
          action: 'edit',
          source: selectedDeposit.source,
          editData: editForm,
        }),
      });

      if (res.ok) {
        fetchDeposits();
        setShowEditModal(false);
        setSelectedDeposit(null);
      }
    } catch (error) {
      console.error('Edit failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = (deposit: Deposit) => {
    setSelectedDeposit(deposit);
    setEditForm({
      amount: deposit.amount,
      status: deposit.status,
      description: deposit.description || '',
      balanceBefore: deposit.balanceBefore || 0,
      balanceAfter: deposit.balanceAfter || 0,
      createdAt: new Date(deposit.createdAt).toISOString().slice(0, 16),
    });
    setShowEditModal(true);
  };

  const handleDelete = async () => {
    if (!selectedDeposit) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/deposits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ depositId: selectedDeposit._id, action: 'delete', source: selectedDeposit.source }),
      });
      if (res.ok) {
        fetchDeposits();
        setShowDeleteDialog(false);
        setSelectedDeposit(null);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = Math.ceil(totalDeposits / limit);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Deposits</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage and process user deposit requests
          </p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={() => {
            // Export functionality
          }}
        >
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by reference or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <Select
            options={[
              { value: '', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-40"
          />
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </Card>

      {/* Deposits Table */}
      <Card padding="none">
        {/* Mobile Cards */}
        <div className="sm:hidden divide-y divide-[var(--border)]">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="p-4"><div className="h-20 bg-[var(--bg)] rounded animate-pulse" /></div>
            ))
          ) : deposits.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)]">No deposits found</div>
          ) : (
            deposits.map((deposit) => (
              <div key={deposit._id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">{deposit.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{deposit.user?.email}</p>
                    <p className="text-xs font-mono text-[var(--text-muted)] truncate">{deposit.reference}</p>
                  </div>
                  <StatusBadge status={deposit.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-[var(--success)] text-base">+{formatCurrency(deposit.amount)}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${deposit.source === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {deposit.source === 'user' ? 'User' : 'Admin'}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{formatDate(deposit.createdAt)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => { setSelectedDeposit(deposit); setShowViewModal(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-[var(--bg)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--border)] transition-colors">
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button onClick={() => openEditModal(deposit)} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-[var(--primary-light)] text-[var(--primary)] font-medium text-sm hover:opacity-80 transition-colors">
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  {deposit.status === 'pending' && (
                    <>
                      <button onClick={() => { setSelectedDeposit(deposit); setShowApproveDialog(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-green-50 text-green-700 font-medium text-sm hover:bg-green-100 transition-colors">
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => { setSelectedDeposit(deposit); setShowRejectDialog(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-red-50 text-red-700 font-medium text-sm hover:bg-red-100 transition-colors">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </>
                  )}
                  <button onClick={() => { setSelectedDeposit(deposit); setShowDeleteDialog(true); }} className="flex items-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 transition-colors ml-auto">
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
                  <TableRow key={i}>
                    <TableCell colSpan={7}><div className="h-12 bg-[var(--bg)] rounded animate-pulse" /></TableCell>
                  </TableRow>
                ))
              ) : deposits.length === 0 ? (
                <TableEmpty message="No deposits found" colSpan={7} />
              ) : (
                deposits.map((deposit) => (
                  <TableRow key={deposit._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{deposit.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-[var(--text-muted)]">{deposit.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell><span className="font-mono text-sm">{deposit.reference}</span></TableCell>
                    <TableCell align="right">
                      <span className="font-semibold text-[var(--success)]">+{formatCurrency(deposit.amount)}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${deposit.source === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {deposit.source === 'user' ? 'User Request' : 'Admin'}
                      </span>
                    </TableCell>
                    <TableCell><StatusBadge status={deposit.status} /></TableCell>
                    <TableCell><span className="text-sm text-[var(--text-secondary)]">{formatDate(deposit.createdAt)}</span></TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setSelectedDeposit(deposit); setShowViewModal(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg)] text-[var(--text-secondary)]" title="View Details"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => openEditModal(deposit)} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--primary-light)] text-[var(--primary)]" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => { setSelectedDeposit(deposit); setShowDeleteDialog(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error-light)] text-[var(--error)]" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        {deposit.status === 'pending' && (
                          <>
                            <button onClick={() => { setSelectedDeposit(deposit); setShowApproveDialog(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--success-light)] text-[var(--success)]" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => { setSelectedDeposit(deposit); setShowRejectDialog(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error-light)] text-[var(--error)]" title="Reject"><XCircle className="w-4 h-4" /></button>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[var(--border)]">
            <PageInfo currentPage={currentPage} totalPages={totalPages} totalItems={totalDeposits} itemsPerPage={limit} />
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </Card>

      {/* View Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedDeposit(null);
        }}
        title="Deposit Details"
        size="md"
      >
        {selectedDeposit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--text-muted)]">Reference</p>
                <p className="font-mono text-sm">{selectedDeposit.reference}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Status</p>
                <StatusBadge status={selectedDeposit.status} />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Amount</p>
                <p className="font-semibold text-[var(--success)]">
                  {formatCurrency(selectedDeposit.amount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Source</p>
                <span className={`text-xs px-2 py-1 rounded-full ${selectedDeposit.source === 'user' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                  {selectedDeposit.source === 'user' ? 'User Request' : 'Admin'}
                </span>
              </div>
              {selectedDeposit.source === 'admin' && (
                <>
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">Balance Before</p>
                    <p>{formatCurrency(selectedDeposit.balanceBefore)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">Balance After</p>
                    <p>{formatCurrency(selectedDeposit.balanceAfter)}</p>
                  </div>
                </>
              )}
              {selectedDeposit.source === 'user' && selectedDeposit.paymentMethod && (
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Payment Method</p>
                  <p className="capitalize">{selectedDeposit.paymentMethod.name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-[var(--text-muted)]">User</p>
                <p>{selectedDeposit.user?.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{selectedDeposit.user?.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-[var(--text-muted)]">Description</p>
                <p>{selectedDeposit.description}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Date</p>
                <p>{formatDate(selectedDeposit.createdAt)}</p>
              </div>
            </div>
            {selectedDeposit.source === 'user' && selectedDeposit.proofImage && (
              <div className="pt-4 border-t border-[var(--border)]">
                <p className="text-sm text-[var(--text-muted)] mb-2">Payment Proof</p>
                <img
                  src={selectedDeposit.proofImage}
                  alt="Payment proof"
                  className="max-w-full rounded-[var(--radius-md)] border border-[var(--border)]"
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Approve Dialog */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => {
          setShowApproveDialog(false);
          setSelectedDeposit(null);
        }}
        onConfirm={handleApprove}
        title="Approve Deposit"
        message={`Are you sure you want to approve this deposit of ${selectedDeposit ? formatCurrency(selectedDeposit.amount) : ''}? The amount will be credited to the user's account.`}
        confirmText="Approve"
        variant="primary"
        isLoading={isProcessing}
      />

      {/* Reject Dialog */}
      <Modal
        isOpen={showRejectDialog}
        onClose={() => {
          setShowRejectDialog(false);
          setSelectedDeposit(null);
          setRejectReason('');
        }}
        title="Reject Deposit"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to reject this deposit of{' '}
            <span className="font-semibold">
              {selectedDeposit ? formatCurrency(selectedDeposit.amount) : ''}
            </span>
            ?
          </p>
          <Input
            label="Reason (optional)"
            placeholder="Enter reason for rejection..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedDeposit(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} isLoading={isProcessing}>
              Reject
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedDeposit(null);
        }}
        title="Edit Deposit"
        size="md"
      >
        {selectedDeposit && (
          <div className="space-y-4">
            <Input
              label="Amount"
              type="number"
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
            />
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
            {selectedDeposit.source === 'admin' && (
              <>
                <Input
                  label="Description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
                <Input
                  label="Balance Before"
                  type="number"
                  value={editForm.balanceBefore}
                  onChange={(e) => setEditForm({ ...editForm, balanceBefore: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Balance After"
                  type="number"
                  value={editForm.balanceAfter}
                  onChange={(e) => setEditForm({ ...editForm, balanceAfter: parseFloat(e.target.value) || 0 })}
                />
              </>
            )}
            <Input
              label="Date"
              type="datetime-local"
              value={editForm.createdAt}
              onChange={(e) => setEditForm({ ...editForm, createdAt: e.target.value })}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedDeposit(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleEdit} isLoading={isProcessing}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setSelectedDeposit(null); }}
        onConfirm={handleDelete}
        title="Delete Deposit"
        message={`Are you sure you want to delete this deposit of ${selectedDeposit ? formatCurrency(selectedDeposit.amount) : ''}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isProcessing}
      />
    </div>
  );
}
