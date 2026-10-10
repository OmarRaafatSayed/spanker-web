'use client';

import { useState } from 'react';
import { FlightSearchForm } from '@/components/flights/FlightSearchForm';
import { FlightResults } from '@/components/flights/FlightResults';

export default function FlightSearchPage() {
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleResults = (data: any[]) => {
    setResults(data);
    setError(null);
  };

  const handleError = (errorMsg: string) => {
    setError(errorMsg);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Search Flights</h1>
        <p className="text-gray-600">Real-time flight prices from Google Flights</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <FlightSearchForm 
            onResults={handleResults}
            onError={handleError}
          />
        </div>

        <div className="lg:col-span-2">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <FlightResults results={results} />
        </div>
      </div>
    </div>
  );
}
