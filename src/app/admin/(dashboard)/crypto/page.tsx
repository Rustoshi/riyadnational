'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button, Input, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty, StatusBadge, Modal, ConfirmDialog } from '@/components/ui';

interface CryptoAsset {
  _id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  isActive: boolean;
  icon?: string;
}

export default function CryptoPage() {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selected, setSelected] = useState<CryptoAsset | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({ name: '', symbol: '', price: '', change24h: '0' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/crypto', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setAssets(data.data || []);
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
      const res = await fetch('/api/admin/crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, price: parseFloat(formData.price), change24h: parseFloat(formData.change24h) }),
      });
      if (res.ok) { fetchData(); setShowCreate(false); setFormData({ name: '', symbol: '', price: '', change24h: '0' }); }
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
      const res = await fetch('/api/admin/crypto', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ assetId: selected._id, ...formData, price: parseFloat(formData.price), change24h: parseFloat(formData.change24h) }),
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
      const res = await fetch(`/api/admin/crypto?assetId=${selected._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { fetchData(); setShowDelete(false); setSelected(null); }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openEdit = (asset: CryptoAsset) => {
    setSelected(asset);
    setFormData({ name: asset.name, symbol: asset.symbol, price: asset.price.toString(), change24h: asset.change24h.toString() });
    setShowEdit(true);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Crypto Assets</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Manage cryptocurrency assets and prices</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Add Asset</Button>
      </div>

      <Card padding="none">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead align="right">Price</TableHead>
              <TableHead align="right">24h Change</TableHead>
              <TableHead>Status</TableHead>
              <TableHead align="right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={6}><div className="h-12 bg-[var(--bg)] rounded animate-pulse" /></TableCell></TableRow>)
            ) : assets.length === 0 ? (
              <TableEmpty message="No crypto assets found" colSpan={6} />
            ) : (
              assets.map((asset) => (
                <TableRow key={asset._id}>
                  <TableCell><span className="font-medium text-[var(--text-primary)]">{asset.name}</span></TableCell>
                  <TableCell><span className="font-mono text-sm uppercase">{asset.symbol}</span></TableCell>
                  <TableCell align="right"><span className="font-semibold">{formatCurrency(asset.price)}</span></TableCell>
                  <TableCell align="right">
                    <span className={`flex items-center justify-end gap-1 font-medium ${asset.change24h >= 0 ? 'text-[var(--success)]' : 'text-[var(--error)]'}`}>
                      {asset.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell><StatusBadge status={asset.isActive ? 'active' : 'inactive'} /></TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(asset)} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--bg)] text-[var(--text-secondary)]"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => { setSelected(asset); setShowDelete(true); }} className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--error-light)] text-[var(--error)]"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add Crypto Asset" size="sm">
        <div className="space-y-4">
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Bitcoin" />
          <Input label="Symbol" value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} placeholder="BTC" />
          <Input label="Price (USD)" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="50000" />
          <Input label="24h Change (%)" type="number" value={formData.change24h} onChange={(e) => setFormData({ ...formData, change24h: e.target.value })} placeholder="2.5" />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} isLoading={isProcessing}>Add Asset</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setSelected(null); }} title="Edit Crypto Asset" size="sm">
        <div className="space-y-4">
          <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          <Input label="Symbol" value={formData.symbol} onChange={(e) => setFormData({ ...formData, symbol: e.target.value })} />
          <Input label="Price (USD)" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
          <Input label="24h Change (%)" type="number" value={formData.change24h} onChange={(e) => setFormData({ ...formData, change24h: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => { setShowEdit(false); setSelected(null); }}>Cancel</Button>
            <Button onClick={handleUpdate} isLoading={isProcessing}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={showDelete} onClose={() => { setShowDelete(false); setSelected(null); }} onConfirm={handleDelete} title="Delete Asset" message={`Delete ${selected?.name}? This cannot be undone.`} confirmText="Delete" variant="danger" isLoading={isProcessing} />
    </div>
  );
}
