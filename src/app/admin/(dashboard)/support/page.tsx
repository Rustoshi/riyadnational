'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    MessageSquare,
    Search,
    Filter,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    CheckCircle,
    Clock,
    AlertCircle,
    Eye,
} from 'lucide-react';
import { Card } from '@/components/ui';

interface SupportTicket {
    _id: string;
    ticketNumber: string;
    subject: string;
    message: string;
    priority: string;
    status: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };
    createdAt: string;
}

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchTickets();
    }, [page, statusFilter, search]); // Re-fetch when params change

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
            });
            if (statusFilter) params.append('status', statusFilter);
            if (search) params.append('search', search);

            const res = await fetch(`/api/admin/support?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setTickets(data.data.tickets);
                setTotalPages(data.data.pagination.pages);
            }
        } catch (error) {
            console.error('Failed to fetch tickets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" /> Open</span>;
            case 'in_progress':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" /> In Progress</span>;
            case 'resolved':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Resolved</span>;
            case 'closed':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><CheckCircle className="h-3 w-3 mr-1" /> Closed</span>;
            default:
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'high':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">High</span>;
            case 'medium':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Medium</span>;
            case 'low':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Low</span>;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Support Tickets</h1>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Manage and respond to user support requests
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            className="w-full pl-10 pr-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-48 relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                        <select
                            className="w-full pl-10 pr-4 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>
            </Card>

            {/* Tickets List */}
            <Card className="overflow-hidden">
                {/* Mobile Cards */}
                <div className="sm:hidden divide-y divide-[var(--border)]">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="p-4"><div className="h-20 bg-[var(--bg)] rounded animate-pulse" /></div>
                        ))
                    ) : tickets.length === 0 ? (
                        <div className="p-8 text-center text-[var(--text-muted)]">No tickets found</div>
                    ) : (
                        tickets.map((ticket) => (
                            <div key={ticket._id} className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-medium text-[var(--text-primary)] truncate">{ticket.subject}</p>
                                        <p className="text-xs text-[var(--text-muted)]">#{ticket.ticketNumber}</p>
                                        <p className="text-xs text-[var(--text-muted)] truncate">{ticket.user?.name || 'Unknown'}</p>
                                    </div>
                                    {getStatusBadge(ticket.status)}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {getPriorityBadge(ticket.priority)}
                                        <span className="text-xs text-[var(--text-muted)]">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <Link
                                        href={`/admin/support/${ticket._id}`}
                                        className="flex items-center gap-1.5 py-2 px-4 rounded-[var(--radius-md)] bg-[var(--primary)] text-white font-medium text-sm hover:bg-[var(--primary-dark)] transition-colors"
                                    >
                                        <Eye className="h-4 w-4" /> View
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[var(--bg)] border-b border-[var(--border)]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Ticket Details</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Priority</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">Loading tickets...</td></tr>
                            ) : tickets.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">No tickets found</td></tr>
                            ) : (
                                tickets.map((ticket) => (
                                    <tr key={ticket._id} className="hover:bg-[var(--bg)] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-[var(--text-primary)]">{ticket.subject}</span>
                                                <span className="text-xs text-[var(--text-muted)]">#{ticket.ticketNumber}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-[var(--text-primary)]">{ticket.user?.name || 'Unknown User'}</span>
                                                <span className="text-xs text-[var(--text-muted)]">{ticket.user?.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{getStatusBadge(ticket.status)}</td>
                                        <td className="px-6 py-4">{getPriorityBadge(ticket.priority)}</td>
                                        <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/admin/support/${ticket._id}`}
                                                className="inline-flex items-center px-3 py-1.5 border border-[var(--primary)] text-[var(--primary)] text-xs font-medium rounded hover:bg-[var(--primary-light)] transition-colors"
                                            >
                                                <Eye className="h-3 w-3 mr-1" /> View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-between">
                        <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-3 py-1 border border-[var(--border)] rounded text-sm disabled:opacity-50">Previous</button>
                        <span className="text-sm text-[var(--text-secondary)]">Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 border border-[var(--border)] rounded text-sm disabled:opacity-50">Next</button>
                    </div>
                )}
            </Card>
        </div>
    );
}
