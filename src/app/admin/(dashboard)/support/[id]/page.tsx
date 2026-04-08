'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Clock,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    Send,
    User,
    Calendar,
    Loader2,
    Mail
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import toast from 'react-hot-toast';

interface SupportTicket {
    _id: string;
    ticketNumber: string;
    subject: string;
    message: string;
    priority: string;
    status: string;
    adminResponse?: string;
    respondedAt?: string;
    user: {
        _id: string;
        name: string;
        email: string;
        profilePhoto?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [ticket, setTicket] = useState<SupportTicket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [replyMessage, setReplyMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const res = await fetch(`/api/admin/support/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) {
                    setTicket(data.data.ticket);
                } else {
                    toast.error('Failed to load ticket');
                    router.push('/admin/support');
                }
            } catch (error) {
                console.error('Error fetching ticket:', error);
                toast.error('Error fetching ticket');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTicket();
    }, [id, router]);

    const handleStatusUpdate = async (newStatus: string) => {
        if (!ticket) return;
        setUpdatingStatus(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/support/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
                setTicket(prev => prev ? { ...prev, status: newStatus } : null);
            } else {
                toast.error(data.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Error updating status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`/api/admin/support/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ adminResponse: replyMessage }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Reply sent successfully');
                setTicket(prev => prev ? {
                    ...prev,
                    adminResponse: replyMessage,
                    respondedAt: new Date().toISOString(),
                    status: 'resolved'
                } : null);
                setReplyMessage('');
            } else {
                toast.error(data.error || 'Failed to send reply');
            }
        } catch (error) {
            console.error('Error sending reply:', error);
            toast.error('Error sending reply');
        } finally {
            setIsSubmitting(false);
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
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">High Priority</span>;
            case 'medium':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Medium Priority</span>;
            case 'low':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Low Priority</span>;
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">Ticket not found</p>
                <Link href="/admin/support" className="text-[var(--primary)] hover:underline mt-2 inline-block">
                    Return to list
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Link href="/admin/support" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Ticket Details</h1>
                        <p className="text-sm text-[var(--text-secondary)]">
                            #{ticket.ticketNumber} • Created {new Date(ticket.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={ticket.status}
                        onChange={(e) => handleStatusUpdate(e.target.value)}
                        disabled={updatingStatus}
                        className="bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] text-sm rounded-lg focus:ring-[var(--primary)] focus:border-[var(--primary)] block p-2.5"
                    >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Ticket Message */}
                    <Card>
                        <CardHeader className="border-b border-[var(--border)] p-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                            {getPriorityBadge(ticket.priority)}
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap text-[var(--text-primary)]">{ticket.message}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Admin Response Section */}
                    <Card>
                        <CardHeader className="border-b border-[var(--border)] p-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" /> Response
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {ticket.adminResponse ? (
                                <div className="bg-[var(--bg)] rounded-lg p-4 border border-[var(--border)]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-[var(--text-primary)]">Admin Response</span>
                                        <span className="text-xs text-[var(--text-secondary)]">
                                            {new Date(ticket.respondedAt!).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="whitespace-pre-wrap text-[var(--text-secondary)]">{ticket.adminResponse}</p>
                                </div>
                            ) : (
                                <form onSubmit={handleReply}>
                                    <div className="mb-4">
                                        <label htmlFor="reply" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                            Write a reply
                                        </label>
                                        <textarea
                                            id="reply"
                                            rows={5}
                                            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none resize-none"
                                            placeholder="Type your response here..."
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                        ></textarea>
                                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                                            Sending a reply will automatically mark the ticket as resolved.
                                        </p>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={!replyMessage.trim() || isSubmitting}
                                            className="inline-flex items-center px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4 mr-2" />
                                                    Send Reply
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* User Info */}
                    <Card>
                        <CardHeader className="border-b border-[var(--border)] p-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" /> User Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-10 w-10 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-medium">
                                    {ticket.user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <p className="font-medium text-[var(--text-primary)]">{ticket.user?.name || 'Unknown User'}</p>
                                    <p className="text-sm text-[var(--text-secondary)]">Client</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <Mail className="h-4 w-4" />
                                    <a href={`mailto:${ticket.user?.email}`} className="hover:text-[var(--primary)]">
                                        {ticket.user?.email || 'No email'}
                                    </a>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                <Link
                                    href={`/admin/users/${ticket.user?._id}`}
                                    className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1"
                                >
                                    View full profile
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ticket Meta */}
                    <Card>
                        <CardHeader className="border-b border-[var(--border)] p-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5" /> Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex gap-3">
                                <div className="mt-1">
                                    <div className="h-2 w-2 rounded-full bg-[var(--primary)]"></div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">Ticket Created</p>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        {new Date(ticket.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {ticket.updatedAt !== ticket.createdAt && (
                                <div className="flex gap-3">
                                    <div className="mt-1">
                                        <div className="h-2 w-2 rounded-full bg-[var(--text-muted)]"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text-primary)]">Last Updated</p>
                                        <p className="text-xs text-[var(--text-secondary)]">
                                            {new Date(ticket.updatedAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {ticket.status === 'closed' && (
                                <div className="flex gap-3">
                                    <div className="mt-1">
                                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text-primary)]">Closed</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
