'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MoreVertical } from 'lucide-react';
import {
  Button, Input, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty,
  StatusBadge, Modal, ConfirmDialog,
} from '@/components/ui';

interface Plan {
  _id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  returnPercentage: number;
  durationDays: number;
  status: string;
  createdAt: string;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', minAmount: '', maxAmount: '', returnPercentage: '', durationDays: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/plans', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setPlans(data.data || []);
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
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          minAmount: parseFloat(formData.minAmount),
          maxAmount: parseFloat(formData.maxAmount),
          returnPercentage: parseFloat(formData.returnPercentage),
          durationDays: parseInt(formData.durationDays),
        }),
      });
      if (res.ok) {
        fetchData();
        setShowCreate(false);
        setFormData({ name: '', description: '', minAmount: '', maxAmount: '', returnPercentage: '', durationDays: '' });
      }
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
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          planId: selected._id,
          action: 'update',
          ...formData,
          minAmount: parseFloat(formData.minAmount),
          maxAmount: parseFloat(formData.maxAmount),
          returnPercentage: parseFloat(formData.returnPercentage),
          durationDays: parseInt(formData.durationDays),
        }),
      });
      if (res.ok) {
        fetchData();
        setShowEdit(false);
        setSelected(null);
      }
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
      const res = await fetch(`/api/admin/plans?planId=${selected._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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

  const openEdit = (plan: Plan) => {
    setSelected(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      minAmount: plan.minAmount.toString(),
      maxAmount: plan.maxAmount.toString(),
      returnPercentage: plan.returnPercentage.toString(),
      durationDays: plan.durationDays.toString(),
    });
    setShowEdit(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Investment Plans</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage investment plans and packages</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Add Plan</Button>
      </div>

      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Investment Range</TableHead>
              <TableHead align="right">Return %</TableHead>
              <TableHead align="right">Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(3)].map((_, i) => <TableRow key={i}><TableCell colSpan={6}><div className="h-12 bg-[var(--bg)] rounded animate-pulse" /></TableCell></TableRow>)
            ) : plans.length === 0 ? (
              <TableEmpty message="No plans found" colSpan={6} />
            ) : (
              plans.map((plan) => (
                <TableRow key={plan._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{plan.name}</p>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-1">{plan.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(plan.minAmount)} - {formatCurrency(plan.maxAmount)}</TableCell>
                  <TableCell align="right"><span className="font-semibold text-[var(--success)]">{plan.returnPercentage}%</span></TableCell>
                  <TableCell align="right">{plan.durationDays} days</TableCell>
                  <TableCell><StatusBadge status={plan.status} /></TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(plan)} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg)] text-[var(--text-secondary)]"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { setSelected(plan); setShowDelete(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error-light)] text-[var(--error)]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Investment Plan" size="md">
        <div className="space-y-4">
          <Input label="Plan Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Starter Plan" />
          <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief description" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Amount ($)" type="number" value={formData.minAmount} onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })} placeholder="100" />
            <Input label="Max Amount ($)" type="number" value={formData.maxAmount} onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })} placeholder="10000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Return %" type="number" value={formData.returnPercentage} onChange={(e) => setFormData({ ...formData, returnPercentage: e.target.value })} placeholder="10" />
            <Input label="Duration (days)" type="number" value={formData.durationDays} onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })} placeholder="30" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={isProcessing}>Create Plan</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setSelected(null); }} title="Edit Investment Plan" size="md">
        <div className="space-y-4">
          <Input label="Plan Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Amount ($)" type="number" value={formData.minAmount} onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })} />
            <Input label="Max Amount ($)" type="number" value={formData.maxAmount} onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Return %" type="number" value={formData.returnPercentage} onChange={(e) => setFormData({ ...formData, returnPercentage: e.target.value })} />
            <Input label="Duration (days)" type="number" value={formData.durationDays} onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowEdit(false); setSelected(null); }}>Cancel</Button>
            <Button onClick={handleUpdate} isLoading={isProcessing}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={showDelete} onClose={() => { setShowDelete(false); setSelected(null); }} onConfirm={handleDelete} title="Delete Plan" message={`Are you sure you want to delete "${selected?.name}"? This action cannot be undone.`} confirmText="Delete" variant="danger" isLoading={isProcessing} />
    </div>
  );
}
