'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface StatusHistory {
  status_id: number;
  status: string;
  location: string;
  remarks: string;
  updated_at: string;
}

interface CourierDetails {
  courier_id: number;
  tracking_number: string;
  sender_name: string;
  receiver_name: string;
  origin: string;
  destination: string;
  current_status: string;
}

export default function CourierHistory() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [courier, setCourier] = useState<CourierDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState({
    status: '',
    location: '',
    remarks: ''
  });

  useEffect(() => {
    if (id) {
      fetchHistory();
    }
  }, [id]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const courierRes = await fetch(`/api/couriers/${id}`);
      if (courierRes.ok) {
        const courierData = await courierRes.json();
        setCourier(courierData);
      }

      const historyRes = await fetch(`/api/couriers/${id}/history`);
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus.status) {
      alert('Please select a status');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/couriers/${id}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStatus)
      });

      if (res.ok) {
        setShowAddStatus(false);
        setNewStatus({ status: '', location: '', remarks: '' });
        fetchHistory();
        alert('Status updated successfully!');
      } else {
        const error = await res.json();
        alert('Failed to update status: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to add status:', error);
      alert('Failed to add status update');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Delivered': return 'text-[var(--accent-emerald)] bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.2)]';
      case 'Cancelled': return 'text-[var(--accent-rose)] bg-[rgba(244,63,94,0.1)] border-[rgba(244,63,94,0.2)]';
      case 'In Transit': return 'text-[var(--accent-sky)] bg-[rgba(14,165,233,0.1)] border-[rgba(14,165,233,0.2)]';
      case 'Booked': return 'text-[var(--accent-amber)] bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.2)]';
      default: return 'text-[var(--text-secondary)] bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)]';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="spinner" />
        <p className="text-[var(--text-secondary)] animate-pulse">Retrieving tracking records...</p>
      </div>
    );
  }

  if (!courier) {
    return (
      <div className="text-center py-20 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl">
        <div className="text-[var(--accent-rose)] text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Shipment Not Found</h2>
        <p className="text-[var(--text-secondary)] mt-2">The tracking ID provided does not match any records.</p>
        <button
          onClick={() => router.push('/dashboard/couriers')}
          className="mt-6 text-[var(--accent-primary)] hover:underline flex items-center gap-2 justify-center mx-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to Shipment List
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <button
        onClick={() => router.back()}
        className="mb-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors group"
      >
        <div className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg group-hover:border-[var(--accent-primary)] transition-all">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        </div>
        <span className="font-medium text-sm">Return to Shipments</span>
      </button>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
           </svg>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-[var(--text-muted)] text-sm font-semibold uppercase tracking-widest">Tracking Number</span>
              <span className={`status-badge border ${getStatusStyle(courier.current_status)}`}>
                {courier.current_status}
              </span>
            </div>
            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter">
              {courier.tracking_number}
            </h1>
            <p className="text-[var(--text-secondary)] mt-3 flex items-center gap-2 text-lg">
              <span className="font-semibold text-[var(--text-primary)]">{courier.origin || 'Origin'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-[var(--accent-primary)]">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
              <span className="font-semibold text-[var(--text-primary)]">{courier.destination || 'Destination'}</span>
            </p>
          </div>
          <button
            onClick={() => setShowAddStatus(!showAddStatus)}
            className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white whitespace-nowrap shadow-xl"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Update Milestone
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10 pt-8 border-t border-[var(--border-color)]">
          <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
            <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">Sender Details</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{courier.sender_name || 'Not Available'}</p>
          </div>
          <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)]">
            <p className="text-[var(--text-muted)] text-xs font-bold uppercase tracking-widest mb-1">Receiver Details</p>
            <p className="text-lg font-semibold text-[var(--text-primary)]">{courier.receiver_name || 'Not Available'}</p>
          </div>
        </div>
      </div>

      {showAddStatus && (
        <div className="bg-[var(--bg-card)] border border-[var(--accent-primary)] rounded-2xl p-8 mb-8 shadow-2xl animate-modal-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Log New Milestone</h2>
            <button onClick={() => setShowAddStatus(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <form onSubmit={addStatusUpdate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Select Milestone Status *</label>
                <select
                  required
                  value={newStatus.status}
                  onChange={(e) => setNewStatus({ ...newStatus, status: e.target.value })}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all"
                >
                  <option value="">Choose status...</option>
                  <option value="Booked">Booked</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Current Location</label>
                <input
                  type="text"
                  value={newStatus.location}
                  onChange={(e) => setNewStatus({ ...newStatus, location: e.target.value })}
                  placeholder="e.g. Regional Hub, Terminal 3"
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Status Remarks / Notes</label>
                <textarea
                  value={newStatus.remarks}
                  onChange={(e) => setNewStatus({ ...newStatus, remarks: e.target.value })}
                  placeholder="Any additional details about this update..."
                  rows={2}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-3 px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-all"
                />
              </div>
            </div>
            
            <div className="mt-8 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 btn-primary px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Updating System...' : 'Commit Status Update'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddStatus(false)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-10 flex items-center gap-3">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--accent-primary)]">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
           </svg>
           Journey Timeline
        </h2>
        
        {history.length === 0 ? (
          <div className="text-center py-16 bg-[rgba(255,255,255,0.01)] rounded-2xl border-2 border-dashed border-[var(--border-color)]">
            <p className="text-[var(--text-muted)] font-medium">No movement history logged for this shipment.</p>
          </div>
        ) : (
          <div className="relative pl-10 space-y-0">
            {/* Main Timeline Line */}
            <div className="absolute left-3 top-2 bottom-8 w-0.5 bg-gradient-to-b from-[var(--accent-primary)] via-[var(--border-color)] to-transparent"></div>
            
            {history.map((item, index) => (
              <div key={item.status_id} className="relative pb-12 group last:pb-0">
                {/* Milestone Dot */}
                <div className={`absolute -left-10 top-1.5 w-6 h-6 rounded-full border-4 border-[var(--bg-card)] z-10 transition-transform group-hover:scale-125 ${index === 0 ? 'bg-[var(--accent-primary)] shadow-[0_0_12px_var(--accent-primary)]' : 'bg-[var(--border-color)]'}`}></div>
                
                <div className={`rounded-2xl p-6 transition-all border border-[var(--border-color)] ${index === 0 ? 'bg-[rgba(99,102,241,0.05)] border-[rgba(99,102,241,0.2)] shadow-lg' : 'bg-[rgba(255,255,255,0.01)] hover:bg-[rgba(255,255,255,0.02)] hover:border-[var(--text-muted)]'}`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4">
                    <span className={`status-badge border font-bold ${getStatusStyle(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2 py-1 rounded">
                      {new Date(item.updated_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {item.location && (
                    <p className="text-[var(--text-primary)] font-semibold flex items-center gap-2 mb-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--accent-rose)]"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      {item.location}
                    </p>
                  )}
                  
                  {item.remarks && (
                    <div className="mt-3 p-3 bg-[var(--bg-secondary)] rounded-lg text-sm text-[var(--text-secondary)] italic border-l-2 border-[var(--accent-primary)]">
                      "{item.remarks}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}