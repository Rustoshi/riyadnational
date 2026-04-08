'use client';

import { useState, useEffect } from 'react';
import {
    Check,
    X,
    Search,
} from 'lucide-react';
import {
    Button,
    Input,
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
    ConfirmDialog,
} from '@/components/ui';

interface User {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    country?: string;
    status: string;
    createdAt: string;
}

export default function RegistrationsPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalUsers, setTotalUsers] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    // Actions
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const limit = 10;

    useEffect(() => {
        fetchPendingUsers();
    }, [currentPage]);

    const fetchPendingUsers = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: limit.toString(),
                status: 'pending', // Filter by pending status
            });
            if (searchQuery) params.append('search', searchQuery);

            const res = await fetch(`/api/admin/users?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.success) {
                setUsers(data.data || []);
                setTotalUsers(data.pagination?.total || 0);
            }
        } catch (error) {
            console.error('Failed to fetch pending users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchPendingUsers();
    };

    const handleApprove = async () => {
        if (!selectedUser) return;
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('adminToken');
            // Using unblock API to set status to ACTIVE (since unblock sets status to ACTIVE)
            // Or we can use a direct update if preferred, but unblock is semantically similar "Allow access"
            // Actually, unblock sets to ACTIVE. Let's use that or update status directly.
            // Let's use update endpoint to be explicit.
            const res = await fetch(`/api/admin/users/${selectedUser._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'active' }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setShowApproveDialog(false);
                fetchPendingUsers();
            } else {
                alert(data.message || 'Failed to approve user');
            }
        } catch (error) {
            console.error('Approve failed:', error);
            alert('Failed to approve user');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedUser) return;
        setIsProcessing(true);
        try {
            const token = localStorage.getItem('adminToken');
            // Set to BLOCKED
            const res = await fetch(`/api/admin/users/${selectedUser._id}/block`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                setShowRejectDialog(false);
                fetchPendingUsers();
            } else {
                alert('Failed to reject user');
            }
        } catch (error) {
            console.error('Reject failed:', error);
            alert('Failed to reject user');
        } finally {
            setIsProcessing(false);
        }
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

    const totalPages = Math.ceil(totalUsers / limit);

    return (
        <div className="space-y-6 pb-32">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Pending Registrations</h1>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Review and approve new account applications
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <form onSubmit={handleSearch} className="flex gap-4">
                    <div className="flex-1 max-w-sm">
                        <Input
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search className="w-4 h-4" />}
                        />
                    </div>
                    <Button type="submit" variant="secondary">
                        Search
                    </Button>
                </form>
            </Card>

            {/* Users Table */}
            <Card padding="none" className="overflow-visible">
                {/* Mobile Cards */}
                <div className="sm:hidden divide-y divide-[var(--border)]">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="p-4">
                                <div className="h-16 bg-[var(--bg)] rounded animate-pulse" />
                            </div>
                        ))
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-[var(--text-muted)]">No pending registrations</div>
                    ) : (
                        users.map((user) => (
                            <div key={user._id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 shrink-0 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                            <span className="text-sm font-medium text-yellow-500">
                                                {user.name?.charAt(0).toUpperCase() || 'U'}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-[var(--text-primary)] truncate">{user.name}</p>
                                            <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                                            {user.phone && <p className="text-xs text-[var(--text-muted)]">{user.phone}</p>}
                                        </div>
                                    </div>
                                    <StatusBadge status={user.status} />
                                </div>
                                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                                    <span>{user.country || 'N/A'}</span>
                                    <span>{formatDate(user.createdAt)}</span>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => { setSelectedUser(user); setShowApproveDialog(true); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-green-50 text-green-700 font-medium text-sm hover:bg-green-100 transition-colors"
                                    >
                                        <Check className="w-4 h-4" /> Approve
                                    </button>
                                    <button
                                        onClick={() => { setSelectedUser(user); setShowRejectDialog(true); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-[var(--radius-md)] bg-red-50 text-red-700 font-medium text-sm hover:bg-red-100 transition-colors"
                                    >
                                        <X className="w-4 h-4" /> Reject
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
                                <TableHead>Contact</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Applied On</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead align="right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6}>
                                            <div className="h-12 bg-[var(--bg)] rounded animate-pulse" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : users.length === 0 ? (
                                <TableEmpty message="No pending registrations" colSpan={6} />
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-yellow-500">
                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <div className="font-medium text-[var(--text-primary)]">{user.name}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm">{user.email}</span>
                                                <span className="text-xs text-[var(--text-muted)]">{user.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{user.country || 'N/A'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-[var(--text-secondary)]">{formatDate(user.createdAt)}</span>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={user.status} />
                                        </TableCell>
                                        <TableCell align="right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => { setSelectedUser(user); setShowApproveDialog(true); }}
                                                >
                                                    <Check className="w-4 h-4 mr-1" /> Approve
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => { setSelectedUser(user); setShowRejectDialog(true); }}
                                                >
                                                    <X className="w-4 h-4 mr-1" /> Reject
                                                </Button>
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
                        <PageInfo
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalUsers}
                            itemsPerPage={limit}
                        />
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </Card>

            {/* Approve Dialog */}
            <ConfirmDialog
                isOpen={showApproveDialog}
                onClose={() => setShowApproveDialog(false)}
                onConfirm={handleApprove}
                title="Approve Application"
                message={`Are you sure you want to approve ${selectedUser?.name}? The account will be activated immediately.`}
                confirmText="Approve"
                variant="primary"
                isLoading={isProcessing}
            />

            {/* Reject Dialog */}
            <ConfirmDialog
                isOpen={showRejectDialog}
                onClose={() => setShowRejectDialog(false)}
                onConfirm={handleReject}
                title="Reject Application"
                message={`Are you sure you want to reject ${selectedUser?.name}? The account will be blocked.`}
                confirmText="Reject & Block"
                variant="danger"
                isLoading={isProcessing}
            />
        </div>
    );
}
