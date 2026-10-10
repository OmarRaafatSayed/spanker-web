'use client';

import { useState } from 'react';

interface FlightSearchFormProps {
  onResults: (data: any[]) => void;
  onError?: (error: string) => void;
}

export function FlightSearchForm({ onResults, onError }: FlightSearchFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    origin: 'CAI',
    destination: 'DXB',
    departureDate: '',
    returnDate: '',
    passengers: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/v1/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const json = await res.json();

      if (json.success) {
        onResults(json.data || []);
      } else {
        onError?.(json.error || 'Search failed');
        onResults([]);
      }
    } catch (err: any) {
      onError?.(err.message || 'Network error');
      onResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg bg-white shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">From</label>
          <input
            type="text"
            placeholder="CAI"
            maxLength={3}
            value={formData.origin}
            onChange={e => setFormData(f => ({ ...f, origin: e.target.value.toUpperCase() }))}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To</label>
          <input
            type="text"
            placeholder="DXB"
            maxLength={3}
            value={formData.destination}
            onChange={e => setFormData(f => ({ ...f, destination: e.target.value.toUpperCase() }))}
            className="w-full border p-2 rounded"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Departure Date</label>
          <input
            type="date"
            value={formData.departureDate}
            onChange={e => setFormData(f => ({ ...f, departureDate: e.target.value }))}
            className="w-full border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Return Date (Optional)</label>
          <input
            type="date"
            value={formData.returnDate}
            onChange={e => setFormData(f => ({ ...f, returnDate: e.target.value }))}
            className="w-full border p-2 rounded"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Passengers</label>
        <input
          type="number"
          min="1"
          max="9"
          value={formData.passengers}
          onChange={e => setFormData(f => ({ ...f, passengers: parseInt(e.target.value) || 1 }))}
          className="w-full border p-2 rounded"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-3 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
      >
        {loading ? 'Searching Google Flights...' : 'Search Flights'}
      </button>
    </form>
  );
}
