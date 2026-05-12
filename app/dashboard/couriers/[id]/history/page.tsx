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
      // Fetch courier details
      const courierRes = await fetch(`/api/couriers/${id}`);
      if (courierRes.ok) {
        const courierData = await courierRes.json();
        setCourier(courierData);
      }

      // Fetch status history
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
        fetchHistory(); // Refresh the history
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

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Booked': 'bg-gray-100 text-gray-800',
      'Picked Up': 'bg-blue-100 text-blue-800',
      'In Transit': 'bg-yellow-100 text-yellow-800',
      'Out for Delivery': 'bg-orange-100 text-orange-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!courier) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Courier not found</p>
        <button
          onClick={() => router.push('/dashboard/couriers')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Couriers
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        ← Back to Couriers
      </button>

      {/* Courier Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Tracking: {courier.tracking_number}
            </h1>
            <p className="text-gray-600 mt-1">
              {courier.origin || 'Not specified'} → {courier.destination || 'Not specified'}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(courier.current_status)}`}>
            {courier.current_status}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-500">Sender</p>
            <p className="font-medium">{courier.sender_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Receiver</p>
            <p className="font-medium">{courier.receiver_name || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Add Status Update Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddStatus(!showAddStatus)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + Add Status Update
        </button>
      </div>

      {/* Add Status Form */}
      {showAddStatus && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add Status Update</h2>
          <form onSubmit={addStatusUpdate}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={newStatus.status}
                  onChange={(e) => setNewStatus({ ...newStatus, status: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Select Status</option>
                  <option value="Booked">Booked</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newStatus.location}
                  onChange={(e) => setNewStatus({ ...newStatus, location: e.target.value })}
                  placeholder="e.g., Delhi Sorting Center"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks
                </label>
                <textarea
                  value={newStatus.remarks}
                  onChange={(e) => setNewStatus({ ...newStatus, remarks: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Update'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddStatus(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Status Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Tracking History</h2>
        
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No status updates yet</p>
        ) : (
          <div className="space-y-4">
            {history.map((item, index) => (
              <div key={item.status_id} className="relative pl-8 pb-8">
                {/* Timeline line */}
                {index !== history.length - 1 && (
                  <div className="absolute left-3 top-3 bottom-0 w-0.5 bg-gray-300"></div>
                )}
                
                {/* Timeline dot */}
                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
                
                {/* Content */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(item.updated_at).toLocaleString()}
                    </span>
                  </div>
                  
                  {item.location && (
                    <p className="text-sm text-gray-600 mt-2">
                      📍 {item.location}
                    </p>
                  )}
                  
                  {item.remarks && (
                    <p className="text-sm text-gray-600 mt-1">
                      📝 {item.remarks}
                    </p>
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