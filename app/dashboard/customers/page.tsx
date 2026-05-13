'use client';

import { useEffect, useState } from 'react';

interface Customer {
  customer_id: number;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: ''
  });

  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?page=${page}&limit=${limit}&search=${search}`);
      const data = await res.json();
      setCustomers(data.data || []);
      setTotal(data.total || 0);
      setError(false);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        full_name: customer.full_name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address
      });
    } else {
      setEditingCustomer(null);
      setFormData({ full_name: '', phone: '', email: '', address: '' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCustomer ? 'PUT' : 'POST';
    const body = editingCustomer 
      ? { ...formData, customer_id: editingCustomer.customer_id }
      : formData;

    const res = await fetch('/api/customers', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      fetchCustomers();
      closeModal();
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchCustomers();
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Customers</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage your customer database and records.</p>
        </div>
        
        {error && (
          <div className="mt-2 p-3 bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.2)] rounded-lg flex items-center gap-2 text-[var(--accent-rose)] text-xs animate-fade-in">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            Database Connection Error: Failed to retrieve customer records.
          </div>
        )}
        <button
          onClick={() => openModal()}
          className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Customer
        </button>
      </div>

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl py-3 px-12 text-[var(--text-primary)] input-glow transition-all"
        />
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-2xl mb-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[var(--bg-primary)] text-left text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                <th className="px-6 py-4 border-b border-[var(--border-color)]">ID</th>
                <th className="px-6 py-4 border-b border-[var(--border-color)]">Customer Name</th>
                <th className="px-6 py-4 border-b border-[var(--border-color)]">Contact Info</th>
                <th className="px-6 py-4 border-b border-[var(--border-color)]">Address</th>
                <th className="px-6 py-4 border-b border-[var(--border-color)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="h-4 w-8 skeleton" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 skeleton" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 skeleton" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-48 skeleton" /></td>
                    <td className="px-6 py-4"><div className="h-8 w-20 skeleton ml-auto" /></td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    No customers found. Try a different search.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.customer_id} className="table-row group">
                    <td className="px-6 py-4 text-sm text-[var(--text-muted)] font-mono">#{customer.customer_id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[var(--text-primary)]">{customer.full_name}</div>
                      <div className="text-xs text-[var(--text-muted)]">Joined {new Date(customer.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                          {customer.email || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                          {customer.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--text-secondary)] max-w-xs truncate">
                      {customer.address || 'No address provided'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openModal(customer)}
                          className="p-2 text-[var(--accent-sky)] hover:bg-[rgba(14,165,233,0.1)] rounded-lg transition-colors"
                          title="Edit Customer"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(customer.customer_id)}
                          className="p-2 text-[var(--accent-rose)] hover:bg-[rgba(244,63,94,0.1)] rounded-lg transition-colors"
                          title="Delete Customer"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
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

      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-lg">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-card-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            Previous
          </button>
          <div className="text-sm text-[var(--text-secondary)] font-medium">
            Page <span className="text-[var(--text-primary)]">{page}</span> of <span className="text-[var(--text-primary)]">{totalPages}</span>
          </div>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-card-hover)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      )}

      {/* COMPACT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md shadow-2xl animate-modal-in overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {editingCustomer ? 'Edit Profile' : 'New Customer'}
              </h2>
              <button onClick={closeModal} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input
                    type="text" required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2.5 px-4 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Phone *</label>
                    <input
                      type="text" required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2.5 px-4 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2.5 px-4 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">Address</label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl py-2.5 px-4 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none transition-all resize-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--bg-card-hover)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[1.5] px-4 py-2.5 text-sm font-bold text-white btn-primary rounded-xl"
                >
                  {editingCustomer ? 'Update Profile' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}