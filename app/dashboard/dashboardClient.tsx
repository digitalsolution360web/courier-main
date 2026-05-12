'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardHome() {
  
  const [stats, setStats] = useState({
    customers: 0,
    couriers: 0
  });
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, [router]);

  const fetchStats = async () => {
    try {
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
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const statCards = [
    { title: 'Total Customers', value: stats.customers, icon: '👥', color: 'bg-blue-500' },
    { title: 'Total Couriers', value: stats.couriers, icon: '📦', color: 'bg-green-500' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/dashboard/customers"
            className="bg-blue-50 text-blue-700 p-4 rounded-lg text-center hover:bg-blue-100 transition-colors"
          >
            ➕ Manage Customers
          </a>
          <a
            href="/dashboard/couriers"
            className="bg-green-50 text-green-700 p-4 rounded-lg text-center hover:bg-green-100 transition-colors"
          >
            🚚 Manage Couriers
          </a>
        </div>
      </div>
    </div>
  );
}