'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Button, Input, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty, StatusBadge, Modal, ConfirmDialog } from '@/components/ui';

interface Faq {
  _id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<Faq | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({ question: '', answer: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/cms?type=faq', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setFaqs(data.data || []);
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/cms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'faq', ...formData }),
      });
      if (res.ok) { fetchData(); setShowCreate(false); setFormData({ question: '', answer: '' }); }
    } catch (error) {
      console.error('Create failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/cms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'faq', id: selected._id, ...formData }),
      });
      if (res.ok) { fetchData(); setShowEdit(false); setSelected(null); }
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/cms?type=faq&id=${selected._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { fetchData(); setShowDelete(false); setSelected(null); }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openEdit = (faq: Faq) => {
    setSelected(faq);
    setFormData({ question: faq.question, answer: faq.answer });
    setShowEdit(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">FAQs</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage frequently asked questions</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Add FAQ</Button>
      </div>

      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Question</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => <TableRow key={i}><TableCell colSpan={4}><div className="h-12 bg-[var(--bg)] rounded animate-pulse" /></TableCell></TableRow>)
            ) : faqs.length === 0 ? (
              <TableEmpty message="No FAQs found" colSpan={4} />
            ) : (
              faqs.map((faq) => (
                <TableRow key={faq._id}>
                  <TableCell><span className="text-[var(--text-muted)]">#{faq.order}</span></TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{faq.question}</p>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-1">{faq.answer}</p>
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={faq.isActive ? 'active' : 'inactive'} /></TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(faq)} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg)] text-[var(--text-secondary)]"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { setSelected(faq); setShowDelete(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error-light)] text-[var(--error)]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add FAQ" size="md">
        <div className="space-y-4">
          <Input label="Question" value={formData.question} onChange={(e) => setFormData({ ...formData, question: e.target.value })} placeholder="Enter question" />
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Answer</label>
            <textarea value={formData.answer} onChange={(e) => setFormData({ ...formData, answer: e.target.value })} placeholder="Enter answer" rows={4} className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-30 focus:border-[var(--primary)]" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={isProcessing}>Add FAQ</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setSelected(null); }} title="Edit FAQ" size="md">
        <div className="space-y-4">
          <Input label="Question" value={formData.question} onChange={(e) => setFormData({ ...formData, question: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Answer</label>
            <textarea value={formData.answer} onChange={(e) => setFormData({ ...formData, answer: e.target.value })} rows={4} className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-30 focus:border-[var(--primary)]" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowEdit(false); setSelected(null); }}>Cancel</Button>
            <Button onClick={handleUpdate} isLoading={isProcessing}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={showDelete} onClose={() => { setShowDelete(false); setSelected(null); }} onConfirm={handleDelete} title="Delete FAQ" message="Are you sure you want to delete this FAQ?" confirmText="Delete" variant="danger" isLoading={isProcessing} />
    </div>
  );
}
