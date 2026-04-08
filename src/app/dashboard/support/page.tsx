'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronRight, LifeBuoy, MessageCircleQuestion, Bookmark, Flag,
  MessageSquareText, Info, Send, Loader2, Clock, CheckCircle,
  AlertCircle, ChevronDown, ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface SupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low Priority', description: 'General inquiries, non-urgent matters' },
  { value: 'medium', label: 'Medium Priority', description: 'Important but not time-sensitive' },
  { value: 'high', label: 'High Priority', description: 'Urgent issues requiring immediate attention' },
];

export default function SupportPage() {
  const { user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [showTickets, setShowTickets] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'medium',
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('/api/user/support?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.data?.tickets || []);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Support ticket submitted successfully!');
        setFormData({ subject: '', message: '', priority: 'medium' });
        fetchTickets();
      } else {
        toast.error(data.error || 'Failed to submit ticket');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400"><Clock className="h-3 w-3 mr-1" /> Open</span>;
      case 'in_progress':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400"><AlertCircle className="h-3 w-3 mr-1" /> In Progress</span>;
      case 'resolved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400"><CheckCircle className="h-3 w-3 mr-1" /> Resolved</span>;
      case 'closed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400"><CheckCircle className="h-3 w-3 mr-1" /> Closed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">High</span>;
      case 'medium':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">Medium</span>;
      case 'low':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">Low</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ color: "white" }}>Support Center</h1>
        <div className="flex items-center text-sm mt-1">
          <Link href="/dashboard" className="text-gray-500 hover:text-blue-400">Dashboard</Link>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-600" />
          <span className="text-gray-300">Support</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Submit Ticket Card */}
        <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden mb-6">
          {/* Header */}
          <div className="border-b border-gray-800 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center" style={{ color: "white" }}>
              <LifeBuoy className="h-5 w-5 mr-2 text-blue-400" />
              Submit a Support Ticket
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              We&apos;re here to help. Tell us about your issue and we&apos;ll find a solution.
            </p>
          </div>

          {/* Support Icon */}
          <div className="flex justify-center py-8">
            <div className="h-24 w-24 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MessageCircleQuestion className="h-12 w-12 text-blue-400" />
            </div>
          </div>

          {/* Form */}
          <div className="p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Ticket Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Bookmark className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Briefly describe your issue"
                    maxLength={200}
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Be specific to help us understand your issue</p>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Priority Level
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Flag className="h-5 w-5 text-gray-500" />
                  </div>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-10 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {PRIORITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  </div>
                </div>
                <p className="mt-1 text-xs text-gray-500">Select based on urgency of your request</p>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Describe Your Issue <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <MessageSquareText className="h-5 w-5 text-gray-500" />
                  </div>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={6}
                    maxLength={2000}
                    placeholder="Please provide all relevant details about your issue so we can help you better"
                    className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Include any relevant details that might help us resolve your issue ({formData.message.length}/2000)
                </p>
              </div>

              {/* Info Card */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex">
                  <Info className="h-5 w-5 text-blue-400 shrink-0" />
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-white" style={{ color: "white" }}>Support Information</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Our support team typically responds within 24 hours. For urgent matters,
                      please select &quot;High Priority&quot; and we&apos;ll do our best to assist you sooner.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full md:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium flex items-center justify-center"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Submitting...</>
                ) : (
                  <><Send className="h-5 w-5 mr-2" /> Submit Ticket</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-[#111111] rounded-xl border border-gray-800 overflow-hidden">
          <button
            onClick={() => setShowTickets(!showTickets)}
            className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-white flex items-center" style={{ color: "white" }}>
              <Clock className="h-5 w-5 mr-2 text-blue-400" />
              Recent Tickets
              {tickets.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">
                  {tickets.length}
                </span>
              )}
            </h3>
            <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showTickets ? 'rotate-180' : ''}`} />
          </button>

          {showTickets && (
            <div className="p-4">
              {isLoadingTickets ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircleQuestion className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No support tickets yet</p>
                  <p className="text-sm text-gray-500 mt-1">Submit a ticket above if you need help</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map(ticket => (
                    <div
                      key={ticket._id}
                      className="bg-[#0a0a0a] rounded-lg border border-gray-800 p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">#{ticket.ticketNumber}</p>
                          <h4 className="text-white font-medium" style={{ color: "white" }}>{ticket.subject}</h4>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">{ticket.message}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        {ticket.adminResponse && (
                          <span className="text-green-400 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" /> Response received
                          </span>
                        )}
                      </div>
                      {ticket.adminResponse && (
                        <div className="mt-3 pt-3 border-t border-gray-800">
                          <p className="text-xs text-gray-500 mb-1">Admin Response:</p>
                          <p className="text-sm text-gray-300">{ticket.adminResponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#111111] rounded-xl border border-gray-800 p-5 col-span-2">
            <div className="flex items-center mb-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                <MessageSquareText className="h-5 w-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white" style={{ color: "white" }}>Live Chat</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Chat with our support team in real-time for immediate assistance.
            </p>
            <button className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium">
              Start Chat <ExternalLink className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
