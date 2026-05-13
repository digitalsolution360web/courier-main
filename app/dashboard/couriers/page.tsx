'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Courier {
  courier_id: number;
  tracking_number: string;
  sender_name?: string;
  receiver_name?: string;
  origin: string;
  destination: string;
  package_weight: number;
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
    tracking_number: '', sender_id: '', receiver_id: '',
    origin: '', destination: '', package_weight: '',
    expected_delivery: '', current_status: 'Booked'
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
        tracking_number: c.tracking_number, sender_id: '', receiver_id: '',
        origin: c.origin || '', destination: c.destination || '',
        package_weight: c.package_weight?.toString() || '',
        expected_delivery: c.expected_delivery ? new Date(c.expected_delivery).toISOString().split('T')[0] : '',
        current_status: c.current_status,
      });
    } else {
      setEditingCourier(null);
      setFormData({ tracking_number: `TRK${Date.now().toString().slice(-8)}`, sender_id: '', receiver_id: '', origin: '', destination: '', package_weight: '', expected_delivery: '', current_status: 'Booked' });
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
    <div className="animate-fade-in" style={{ paddingBottom: '30px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>Shipments</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Track and manage all courier logistics.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="btn-primary"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '12px', border: 'none',
            color: '#fff', fontSize: '14px', fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add New
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 20px', 
          marginBottom: '20px', borderRadius: '12px', 
          background: 'rgba(244,63,94,0.05)', border: '1px solid rgba(244,63,94,0.1)', 
          color: '#f43f5e'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ flex: 1, fontSize: '13px', fontWeight: '600' }}>Database Connection Error: Please check if MySQL is running.</span>
          <button onClick={fetchCouriers} style={{ background: '#f43f5e', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>Retry</button>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text" placeholder="Search by tracking id, sender or receiver..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 16px 12px 42px', color: 'var(--text-primary)', fontSize: '14px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                {['Tracking', 'Route Detail', 'Parties', 'Specs', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} style={{ padding: '16px 20px' }}><div className="skeleton" style={{ height: '14px', width: '80%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : couriers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>No shipments found.</td>
                </tr>
              ) : (
                couriers.map((c, idx) => (
                  <tr key={c.courier_id} style={{ borderBottom: idx < couriers.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: 'var(--accent-primary)' }}>{c.tracking_number}</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '600' }}>{c.origin} → {c.destination}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.shipment_date ? new Date(c.shipment_date).toLocaleDateString() : 'Pending'}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}><strong>S:</strong> {c.sender_name || '—'}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}><strong>R:</strong> {c.receiver_name || '—'}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>{c.package_weight} KG</td>
                    <td style={{ padding: '16px 20px' }}><StatusBadge status={c.current_status} /></td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Link href={`/dashboard/couriers/${c.courier_id}/history`} title="Timeline" style={{ padding: '6px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)', display: 'flex' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </Link>
                        <button onClick={() => openModal(c)} title="Edit" style={{ border: 'none', padding: '6px', borderRadius: '8px', background: 'rgba(14,165,233,0.1)', color: 'var(--accent-sky)', display: 'flex', cursor: 'pointer' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
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

      {/* Compact Modal */}
      {showModal && (
        <div 
          onClick={closeModal} 
          style={{ 
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', 
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyCenter: 'center', 
            zIndex: 1000, padding: '16px'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="animate-modal-in"
            style={{ 
              background: 'var(--bg-card)', border: '1px solid var(--border-color)', 
              borderRadius: '20px', width: '100%', maxWidth: '520px', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden' 
            }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {editingCourier ? 'Edit Shipment' : 'New Shipment'}
              </h2>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Tracking Number</label>
                  <input type="text" required value={formData.tracking_number} onChange={e => setFormData(f => ({ ...f, tracking_number: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px 14px', color: 'var(--accent-primary)', fontSize: '14px', fontFamily: 'monospace', fontWeight: '700', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Sender</label>
                  <select required value={formData.sender_id} onChange={e => setFormData(f => ({ ...f, sender_id: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}>
                    <option value="">Select...</option>
                    {customers.map(cu => <option key={cu.customer_id} value={cu.customer_id}>{cu.full_name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Receiver</label>
                  <select required value={formData.receiver_id} onChange={e => setFormData(f => ({ ...f, receiver_id: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}>
                    <option value="">Select...</option>
                    {customers.map(cu => <option key={cu.customer_id} value={cu.customer_id}>{cu.full_name}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Origin</label>
                  <input type="text" required placeholder="City" value={formData.origin} onChange={e => setFormData(f => ({ ...f, origin: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Destination</label>
                  <input type="text" required placeholder="City" value={formData.destination} onChange={e => setFormData(f => ({ ...f, destination: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Weight (KG)</label>
                  <input type="number" step="0.01" required value={formData.package_weight} onChange={e => setFormData(f => ({ ...f, package_weight: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Delivery Date</label>
                  <input type="date" required value={formData.expected_delivery} onChange={e => setFormData(f => ({ ...f, expected_delivery: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '10px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', colorScheme: 'light' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Status</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {statusOptions.map(s => (
                      <button type="button" key={s} onClick={() => setFormData(f => ({ ...f, current_status: s }))}
                        style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid', borderColor: formData.current_status === s ? 'var(--accent-primary)' : 'var(--border-color)', background: formData.current_status === s ? 'rgba(99,102,241,0.1)' : 'transparent', color: formData.current_status === s ? 'var(--accent-primary)' : 'var(--text-secondary)', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={closeModal} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Discard</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1.5, padding: '12px', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '14px', fontWeight: '700', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                  {submitting ? 'Saving...' : editingCourier ? 'Update' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}