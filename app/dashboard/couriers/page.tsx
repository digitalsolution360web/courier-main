'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Courier {
  courier_id: number;
  tracking_number: string;
  courier_type?: string;
  forwarded_details_code?: string;
  sender_id?: number;
  sender_name?: string;
  receiver?: string;
  origin: string;
  destination: string;
  package_weight: number;
  quantity: number;
  item_description: string;
  shipment_date: string;
  expected_delivery: string;
  current_status: string;
}

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string; border: string }> = {
  'Booked':           { bg: 'rgba(245,158,11,0.08)',  color: '#f59e0b', dot: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
  'Picked Up':        { bg: 'rgba(14,165,233,0.08)',  color: '#0ea5e9', dot: '#0ea5e9', border: 'rgba(14,165,233,0.2)' },
  'In Transit':       { bg: 'rgba(99,102,241,0.08)',  color: '#6366f1', dot: '#6366f1', border: 'rgba(99,102,241,0.2)' },
  'Out for Delivery': { bg: 'rgba(251,146,60,0.08)',  color: '#fb923c', dot: '#fb923c', border: 'rgba(251,146,60,0.2)' },
  'Delivered':        { bg: 'rgba(16,185,129,0.08)',  color: '#10b981', dot: '#10b981', border: 'rgba(16,185,129,0.2)' },
  'Cancelled':        { bg: 'rgba(244,63,94,0.08)',   color: '#f43f5e', dot: '#f43f5e', border: 'rgba(244,63,94,0.2)' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { bg: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)', dot: 'var(--text-muted)', border: 'var(--border-color)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 10px', borderRadius: '100px',
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.border}`,
      fontSize: '11px', fontWeight: '700',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

export default function CouriersPage() {
  const [couriers, setCouriers]     = useState<Courier[]>([]);
  const [customers, setCustomers]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [search, setSearch]         = useState('');
  const [showModal, setShowModal]   = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData]     = useState({
    tracking_number: '', courier_type: '',  forwarded_details_code: '', sender_id: '', receiver: '',
    origin: '', destination: '', package_weight: '', quantity: '', item_description: '', shipment_date: '',
    expected_delivery: '', current_status: 'Picked Up'
  });

  const limit = 10;
  const totalPages = Math.ceil(total / limit);
  const statusOptions = ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'];

  useEffect(() => { fetchCouriers(); fetchCustomers(); }, [page, search]);

  const fetchCouriers = async () => {
    setLoading(true); setError('');
    try {
      const res  = await fetch(`/api/couriers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');
      setCouriers(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load couriers');
    } finally { setLoading(false); }
  };

  const fetchCustomers = async () => {
    try {
      const res  = await fetch('/api/customers?limit=1000');
      const data = await res.json();
      setCustomers(data.data ?? []);
    } catch { /* silent */ }
  };

  const openModal = (c?: Courier) => {
    if (c) {
      setEditingCourier(c);
      setFormData({
        tracking_number: c.tracking_number,  courier_type: c.courier_type || '', forwarded_details_code: c.forwarded_details_code || '', sender_id: c.sender_id?.toString() || '', receiver: c.receiver || '',
        origin: c.origin || '', destination: c.destination || '',
        package_weight: c.package_weight?.toString() || '',
        quantity: c.quantity?.toString() || '',
        item_description: c.item_description || '',
        shipment_date: c.shipment_date ? new Date(c.shipment_date).toISOString().split('T')[0] : '',
        expected_delivery: c.expected_delivery ? new Date(c.expected_delivery).toISOString().split('T')[0] : '',
        current_status: c.current_status,
      });
    } else {
      setEditingCourier(null);
      setFormData({ tracking_number: '', courier_type: '',  forwarded_details_code:'', sender_id: '', receiver: '', origin: '', destination: '', package_weight: '', quantity: '', item_description: '', shipment_date: '', expected_delivery: '', current_status: 'Picked Up' });
    }
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingCourier(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      const method = editingCourier ? 'PUT' : 'POST';
      const body   = editingCourier ? { ...formData, courier_id: editingCourier.courier_id } : formData;
      const res    = await fetch('/api/couriers', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) { fetchCouriers(); closeModal(); }
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this shipment?')) return;
    const res = await fetch(`/api/couriers?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchCouriers();
  };

  return (
    <>
      <div className="animate-fade-in pb-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Shipments</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">Track and manage all courier logistics.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-none text-white text-sm font-bold cursor-pointer w-full sm:w-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add New
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-5 rounded-xl bg-[rgba(244,63,94,0.05)] border border-[rgba(244,63,94,0.15)] text-[#f43f5e]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span className="flex-1 text-xs font-semibold">Database Connection Error: Please check if MySQL is running.</span>
          <button onClick={fetchCouriers} className="bg-[#f43f5e] text-white px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer border-none">Retry</button>
        </div>
      )}

      {/* Search */}
      {/* <div className="relative mb-5">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          type="text" placeholder="Search by tracking id, sender or receiver..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-3 pl-10 pr-4 text-[var(--text-primary)] text-sm outline-none"
        />
      </div> */}
      {/* Status Filter */}
      <div className="relative mb-5 max-w-xs">
        <select
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-[var(--text-primary)] text-sm outline-none cursor-pointer"
          style={{ appearance: 'auto' }}
        >
          <option value="">All Statuses</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-lg mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: '700px' }}>
            <thead>
              <tr className="bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                {['Id', 'LR No.','Type','Sender', 'Receiver', 'Origin', 'Destination', 'Weight', 'Item/Quantity', 'Item Details','Date', 'Shipment Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-4 text-left text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-color)]">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-4"><div className="skeleton h-3.5" style={{ width: '75%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : couriers.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-[var(--text-muted)] text-sm">No shipments found.</td></tr>
              ) : (
                couriers.map((c) => (
                  <tr key={c.courier_id} className="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-card-hover)] transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-bold text-[var(--accent-primary)]">#{c.courier_id}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-bold text-[var(--accent-primary)]">{c.tracking_number}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm font-bold text-[var(--accent-primary)]">{c.courier_type}</span>
                      {c.forwarded_details_code && (
                        <>
                        <br /><span className="text-[10px] text-[var(--text-primary)] font-medium mt-1">
                          Code: {c.forwarded_details_code}
                        </span>
                        </>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-[var(--text-primary)]">{c.sender_name}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-xs text-[var(--text-primary)]">{c.receiver}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{c.origin}</div>
                      
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{c.destination}</div>
                      
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{c.package_weight} KG</div>
                      
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{c.quantity}</div>
                      
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{c.item_description}</div>
                    </td>
                    
                    <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                      <div className="text-[11px] text-[var(--text-primary)] mt-0.5" suppressHydrationWarning>{c.shipment_date ? new Date(c.shipment_date).toLocaleDateString("en-GB") : 'Pending'}</div>
                      
                      </td>
                    <td className="px-5 py-4"><StatusBadge status={c.current_status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        <Link href={`/dashboard/couriers/${c.courier_id}/history`} className="p-1.5 rounded-lg bg-[rgba(99,102,241,0.1)] text-[var(--accent-primary)] flex hover:bg-[rgba(99,102,241,0.2)] transition-colors">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </Link>
                        <button onClick={() => openModal(c)} className="p-1.5 rounded-lg bg-[rgba(14,165,233,0.1)] text-[var(--accent-sky)] flex cursor-pointer border-none hover:bg-[rgba(14,165,233,0.2)] transition-colors">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => handleDelete(c.courier_id)} className="p-2 text-[var(--accent-rose)] hover:bg-[rgba(244,63,94,0.1)] rounded-lg transition-colors">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 mb-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4">
              <div className="h-4 w-36 skeleton mb-2" />
              <div className="h-3 w-48 skeleton mb-1" />
              <div className="h-3 w-32 skeleton" />
            </div>
          ))
        ) : couriers.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">No shipments found.</div>
        ) : (
          couriers.map((c) => (
            <div key={c.courier_id} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="font-mono text-sm font-bold text-[var(--accent-primary)]">{c.tracking_number}</span>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">{c.shipment_date ? new Date(c.shipment_date).toLocaleDateString("en-GB") : 'Pending'}</div>
                </div>
                <StatusBadge status={c.current_status} />
              </div>
              {/* Route */}
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] mb-3">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)] flex-shrink-0"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {c.origin} → {c.destination}
              </div>
              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-secondary)] mb-3">
                <div><span className="font-bold text-[var(--text-muted)]">Sender:</span> {c.sender_name || '—'}</div>
                <div><span className="font-bold text-[var(--text-muted)]">Receiver:</span> {c.receiver || '—'}</div>
                <div><span className="font-bold text-[var(--text-muted)]">Weight:</span> {c.package_weight} KG</div>
                <div><span className="font-bold text-[var(--text-muted)]">ETA:</span> <span suppressHydrationWarning>{c.expected_delivery ? new Date(c.expected_delivery).toLocaleDateString("en-GB") : '—'}</span></div>
              </div>
              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-[var(--border-color)]">
                <Link href={`/dashboard/couriers/${c.courier_id}/history`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[rgba(99,102,241,0.1)] text-[var(--accent-primary)] text-xs font-bold hover:bg-[rgba(99,102,241,0.2)] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  History
                </Link>
                <button onClick={() => openModal(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[rgba(14,165,233,0.1)] text-[var(--accent-sky)] text-xs font-bold border-none cursor-pointer hover:bg-[rgba(14,165,233,0.2)] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit
                </button>
                <button onClick={() => handleDelete(c.courier_id)} className="p-2 text-[var(--accent-rose)] hover:bg-[rgba(244,63,94,0.1)] rounded-lg transition-colors">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 md:p-4 shadow-lg mb-4">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}
            className="flex items-center gap-1 px-3 py-2 text-xs md:text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-card-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>Prev
          </button>
          <span className="text-xs md:text-sm text-[var(--text-secondary)] font-medium">
            <span className="text-[var(--text-primary)]">{page}</span> / <span className="text-[var(--text-primary)]">{totalPages}</span>
          </span>
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-xs md:text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-card-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            Next<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}

      </div>

      {/* Compact Modal */}
      {showModal && (
        <div 
          onClick={closeModal} 
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fade-in"
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-modal-in overflow-hidden my-auto"
          >
            <div className="p-5 md:p-6 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/50 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
              <h2 className="m-0 text-lg md:text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
                {editingCourier ? 'Update Shipment' : 'Create Shipment'}
              </h2>
              <button onClick={closeModal} className="bg-none border-none text-[var(--text-muted)] cursor-pointer p-2 hover:bg-[var(--bg-secondary)] rounded-full transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col max-h-[90vh]">
              <div className="flex-1 overflow-y-auto p-4 md:p-7 custom-scrollbar">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">LR No.</label>
                    <input type="text" required placeholder="LR No." value={formData.tracking_number} onChange={e => setFormData(f => ({ ...f, tracking_number: e.target.value }))}
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl py-2 px-4 text-[var(--text-primary)] text-sm font-mono font-bold outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Courier Type</label>
                    <select required value={String(formData.courier_type)} onChange={e => setFormData(f => ({ ...f, courier_type: e.target.value }))}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-[var(--text-primary)] text-xs outline-none">
                      <option value="">Select...</option>
                      {['Consignment','Forwarded Details'].map(cu => <option key={cu} value={String(cu)}>{cu}</option>)}
                    </select>
                  </div>
                  {formData.courier_type === 'Forwarded Details' && (
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">
                        Forwarded Details Code
                      </label>

                      <input
                        type="text"
                        required
                        placeholder="Enter forwarded details code"
                        value={formData.forwarded_details_code}
                        onChange={e =>
                          setFormData(f => ({
                            ...f,
                            forwarded_details_code: e.target.value
                          }))
                        }
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-[var(--text-primary)] text-xs outline-none"
                      />
                    </div>
                  )}

                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Sender</label>
                    <select required value={String(formData.sender_id)} onChange={e => setFormData(f => ({ ...f, sender_id: e.target.value }))}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-[var(--text-primary)] text-xs outline-none">
                      <option value="">Select...</option>
                      {customers.map(cu => <option key={cu.customer_id} value={String(cu.customer_id)}>{cu.full_name}</option>)}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Receiver</label>
                    <input type="text" required placeholder="Receiver" value={formData.receiver} onChange={e => setFormData(f => ({ ...f, receiver: e.target.value }))}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-[var(--text-primary)] text-xs outline-none"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Origin</label>
                    <input type="text" required placeholder="City" value={formData.origin} onChange={e => setFormData(f => ({ ...f, origin: e.target.value }))}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-[var(--text-primary)] text-xs outline-none"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Destination</label>
                    <input type="text" required placeholder="City" value={formData.destination} onChange={e => setFormData(f => ({ ...f, destination: e.target.value }))}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-[var(--text-primary)] text-xs outline-none"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Weight (KG)</label>
                    <input type="number" step="0.01" required value={formData.package_weight} onChange={e => setFormData(f => ({ ...f, package_weight: e.target.value }))} placeholder="0.01"
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-[var(--text-primary)] text-xs outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Quantity</label>
                    <input type="number" required value={formData.quantity} onChange={e => setFormData(f => ({ ...f, quantity: e.target.value }))} placeholder="1"
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-[var(--text-primary)] text-xs outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Item Description</label>
                    <input type="text" required placeholder="Item Description" value={formData.item_description} onChange={e => setFormData(f => ({ ...f, item_description: e.target.value }))}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-[var(--text-primary)] text-xs outline-none"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Shipment Date</label>
                    <input type="date" required value={formData.shipment_date} onChange={e => setFormData(f => ({ ...f, shipment_date: e.target.value }))}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-[var(--text-primary)] text-xs outline-none"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Delivery Date</label>
                    <input type="date" required value={formData.expected_delivery} onChange={e => setFormData(f => ({ ...f, expected_delivery: e.target.value }))}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2 px-3 text-[var(--text-primary)] text-xs outline-none"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>

                  {/* <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Status Milestone</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {statusOptions.map(s => (
                        <button type="button" key={s} onClick={() => setFormData(f => ({ ...f, current_status: s }))}
                          className={`px-1 py-2 rounded-lg border text-[9px] font-bold transition-all truncate ${formData.current_status === s ? 'border-[var(--accent-primary)] bg-indigo-500/10 text-[var(--accent-primary)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div> */}
                </div>
              </div>

              <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/30 flex flex-col gap-2">
                <button type="submit" disabled={submitting} className="btn-primary py-3 rounded-xl border-none text-white text-sm font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-50">
                  {submitting ? 'Saving...' : editingCourier ? 'Update Shipment' : 'Confirm Shipment'}
                </button>
                <button type="button" onClick={closeModal} className="py-2.5 rounded-xl border border-[var(--border-color)] bg-transparent text-[var(--text-secondary)] text-xs font-bold cursor-pointer hover:bg-[var(--bg-secondary)] transition-all">Discard</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}