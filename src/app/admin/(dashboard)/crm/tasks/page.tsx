'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckCircle, Clock } from 'lucide-react';
import { Button, Input, Select, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty, StatusBadge, Modal, ConfirmDialog } from '@/components/ui';

interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
  assignedTo?: { name: string };
  createdAt: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });

  useEffect(() => { fetchData(); }, [statusFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res = await fetch(`/api/admin/crm?type=task&${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setTasks(data.data || []);
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
      const res = await fetch('/api/admin/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'task', ...formData }),
      });
      if (res.ok) { fetchData(); setShowCreate(false); setFormData({ title: '', description: '', priority: 'medium', dueDate: '' }); }
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
      const res = await fetch('/api/admin/crm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'task', id: selected._id, ...formData }),
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
      const res = await fetch(`/api/admin/crm?type=task&id=${selected._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { fetchData(); setShowDelete(false); setSelected(null); }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch('/api/admin/crm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'task', id: task._id, status: newStatus }),
      });
      fetchData();
    } catch (error) {
      console.error('Status update failed:', error);
    }
  };

  const openEdit = (task: Task) => {
    setSelected(task);
    setFormData({ title: task.title, description: task.description || '', priority: task.priority, dueDate: task.dueDate?.split('T')[0] || '' });
    setShowEdit(true);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const priorityColors = { low: 'text-[var(--text-muted)]', medium: 'text-[var(--warning)]', high: 'text-[var(--error)]' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Tasks</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage admin tasks and to-dos</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Add Task</Button>
      </div>

      <Card>
        <Select
          options={[{ value: '', label: 'All Status' }, { value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48"
        />
      </Card>

      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={5}><div className="h-12 bg-[var(--bg)] rounded animate-pulse" /></TableCell></TableRow>)
            ) : tasks.length === 0 ? (
              <TableEmpty message="No tasks found" colSpan={5} />
            ) : (
              tasks.map((task) => (
                <TableRow key={task._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{task.title}</p>
                      {task.description && <p className="text-xs text-[var(--text-muted)] line-clamp-1">{task.description}</p>}
                    </div>
                  </TableCell>
                  <TableCell><span className={`capitalize font-medium ${priorityColors[task.priority]}`}>{task.priority}</span></TableCell>
                  <TableCell>{task.dueDate ? formatDate(task.dueDate) : '-'}</TableCell>
                  <TableCell>
                    <Select
                      options={[{ value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }]}
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value)}
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(task)} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg)] text-[var(--text-secondary)]"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { setSelected(task); setShowDelete(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error-light)] text-[var(--error)]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Task" size="md">
        <div className="space-y-4">
          <Input label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Task title" />
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Task description" rows={3} className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-30 focus:border-[var(--primary)]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Priority" options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} />
            <Input label="Due Date" type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={isProcessing}>Add Task</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setSelected(null); }} title="Edit Task" size="md">
        <div className="space-y-4">
          <Input label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-30 focus:border-[var(--primary)]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Priority" options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} />
            <Input label="Due Date" type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowEdit(false); setSelected(null); }}>Cancel</Button>
            <Button onClick={handleUpdate} isLoading={isProcessing}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={showDelete} onClose={() => { setShowDelete(false); setSelected(null); }} onConfirm={handleDelete} title="Delete Task" message="Are you sure you want to delete this task?" confirmText="Delete" variant="danger" isLoading={isProcessing} />
    </div>
  );
}
