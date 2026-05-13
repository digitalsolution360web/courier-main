'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardHome() {
  const [stats, setStats] = useState({
    customers: 0,
    couriers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [customersRes, couriersRes] = await Promise.all([
        fetch('/api/customers?limit=1'),
        fetch('/api/couriers?limit=1')
      ]);
      
      const customers = await customersRes.json();
      const couriers = await couriersRes.json();

      setStats({
        customers: customers.total || 0,
        couriers: couriers.total || 0
      });
      setError(false);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { 
      title: 'Total Customers', 
      value: stats.customers, 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      color: 'var(--accent-primary)',
      bg: 'rgba(99, 102, 241, 0.1)'
    },
    { 
      title: 'Total Couriers', 
      value: stats.couriers, 
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <path d="M16 8h4l3 3v5h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      ),
      color: 'var(--accent-emerald)',
      bg: 'rgba(16, 185, 129, 0.1)'
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Dashboard Overview</h1>
        <p className="text-[var(--text-secondary)] mt-1">Monitor and manage your courier business metrics.</p>
        
        {error && (
          <div className="mt-6 p-6 bg-[rgba(244,63,94,0.05)] border border-[rgba(244,63,94,0.2)] rounded-2xl animate-fade-in shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[rgba(244,63,94,0.1)] rounded-xl flex items-center justify-center flex-shrink-0 text-[var(--accent-rose)]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Database Connection Failure</h3>
                <p className="text-[var(--text-secondary)] text-sm mt-1 leading-relaxed">
                  The system is receiving <code className="bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded text-[var(--accent-rose)]">ECONNREFUSED</code> at <code className="bg-[var(--bg-secondary)] px-1.5 py-0.5 rounded">127.0.0.1:3306</code>. 
                  Please ensure your <strong>MySQL Service</strong> is started and configured correctly.
                </p>
                <div className="mt-4 flex gap-3">
                  <button 
                    onClick={() => { setLoading(true); fetchStats(); }}
                    className="px-4 py-2 bg-[var(--accent-rose)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                    Retry Connection
                  </button>
                  <a 
                    href="https://dev.mysql.com/doc/refman/8.0/en/starting-server.html" 
                    target="_blank"
                    className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold rounded-lg hover:text-[var(--text-primary)] transition-all"
                  >
                    Troubleshoot Guide
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 md:p-6 card-hover shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-secondary)] text-[10px] md:text-sm font-medium uppercase tracking-wider">{stat.title}</p>
                {loading ? (
                  <div className="h-8 md:h-10 w-20 md:w-24 skeleton mt-2" />
                ) : (
                  <p className="text-2xl md:text-4xl font-bold text-[var(--text-primary)] mt-1">{stat.value.toLocaleString()}</p>
                )}
              </div>
              <div 
                className="rounded-xl w-12 h-12 md:w-14 md:h-14 flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: stat.bg, color: stat.color }}
              >
                {stat.icon}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex items-center gap-2">
              <span className="text-[var(--accent-emerald)] text-[10px] md:text-xs font-semibold flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
                Active
              </span>
              <span className="text-[var(--text-muted)] text-[10px] md:text-xs">Real-time data</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 md:p-8 shadow-lg">
        <div className="mb-6">
          <h2 className="text-lg md:text-xl font-bold text-[var(--text-primary)]">Quick Actions</h2>
          <p className="text-[var(--text-secondary)] text-xs md:text-sm mt-1">Frequently used management tools</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Link
            href="/dashboard/customers"
            className="group relative overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 md:p-6 rounded-xl hover:border-[var(--accent-primary)] transition-all duration-300"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity hidden md:block">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-[rgba(99,102,241,0.1)] text-[var(--accent-primary)] rounded-lg flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="16" y1="11" x2="22" y2="11" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-1">Manage Customers</h3>
              <p className="text-[var(--text-secondary)] text-xs md:text-sm">Add, edit, or remove customer profiles and contact details.</p>
            </div>
          </Link>
          
          <Link
            href="/dashboard/couriers"
            className="group relative overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 md:p-6 rounded-xl hover:border-[var(--accent-emerald)] transition-all duration-300"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity hidden md:block">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <path d="M16 8h4l3 3v5h-7V8z" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="w-10 h-10 bg-[rgba(16,185,129,0.1)] text-[var(--accent-emerald)] rounded-lg flex items-center justify-center mb-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" rx="2" />
                  <path d="M16 8h4l3 3v5h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <h3 className="text-base md:text-lg font-semibold text-[var(--text-primary)] mb-1">Manage Couriers</h3>
              <p className="text-[var(--text-secondary)] text-xs md:text-sm">Create shipments, track delivery status, and update routes.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}