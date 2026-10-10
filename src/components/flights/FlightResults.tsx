'use client';

interface FlightResult {
  price: number;
  currency: string;
  isBest: boolean;
  stops: number;
  durationMinutes: number;
  departure: string; // ISO 8601
  arrival: string;
  origin: string;
  destination: string;
  airlines: string[];
  flightNumbers: string[];
  layovers: Array<{
    airport: string;
    minutes: number;
  }>;
  co2Grams: number;
  co2DeltaPct: number;
  bookingToken: string | null;
}

interface FlightResultsProps {
  results: FlightResult[];
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

export function FlightResults({ results }: FlightResultsProps) {
  if (!results.length) {
    return (
      <div className="text-center py-12 text-gray-500">
        No flights found. Try different search criteria.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          {results.length} Flights Found
        </h2>
        <span className="text-sm text-gray-600 bg-green-100 px-3 py-1 rounded font-medium">
          ✅ Real Google Flights Data
        </span>
      </div>

      <div className="space-y-3">
        {results.map((flight, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 hover:shadow-lg transition-shadow bg-white ${
              flight.isBest ? 'ring-2 ring-green-500' : ''
            }`}
          >
            {flight.isBest && (
              <div className="text-xs font-semibold text-green-600 mb-2">
                ⭐ BEST VALUE
              </div>
            )}

            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-lg">
                    {flight.airlines.join(', ')}
                  </p>
                  {flight.flightNumbers.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {flight.flightNumbers.join(', ')}
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-6">
                  {/* Departure */}
                  <div>
                    <p className="text-2xl font-bold">
                      {formatTime(flight.departure)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {flight.origin}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(flight.departure)}
                    </p>
                  </div>

                  {/* Flight Path */}
                  <div className="flex-1 flex flex-col items-center px-4">
                    <div className="w-full flex items-center justify-center">
                      <div className="flex-1 border-t-2 border-gray-300"></div>
                      <div className="mx-2 text-xs text-gray-600">
                        ✈️ {Math.floor(flight.durationMinutes / 60)}h {flight.durationMinutes % 60}m
                      </div>
                      <div className="flex-1 border-t-2 border-gray-300"></div>
                    </div>
                    
                    {flight.stops > 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        {flight.stops} stop{flight.stops > 1 ? 's' : ''} 
                        {flight.layovers.length > 0 && ` via ${flight.layovers.map(l => l.airport).join(', ')}`}
                      </p>
                    )}
                    {flight.stops === 0 && (
                      <p className="text-xs text-green-600 mt-1">Direct flight</p>
                    )}
                  </div>

                  {/* Arrival */}
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {formatTime(flight.arrival)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {flight.destination}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(flight.arrival)}
                    </p>
                  </div>
                </div>

                {/* Layover details */}
                {flight.layovers.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {flight.layovers.map((layover, i) => (
                      <span key={i}>
                        {layover.airport}: {Math.floor(layover.minutes / 60)}h {layover.minutes % 60}m layover
                        {i < flight.layovers.length - 1 && ' • '}
                      </span>
                    ))}
                  </div>
                )}

                {/* CO2 emissions */}
                {flight.co2Grams > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-gray-600">
                      🌍 {Math.round(flight.co2Grams / 1000)} kg CO₂
                    </span>
                    {flight.co2DeltaPct !== 0 && (
                      <span className={flight.co2DeltaPct > 0 ? 'text-red-600' : 'text-green-600'}>
                        {flight.co2DeltaPct > 0 ? '+' : ''}{flight.co2DeltaPct}% vs avg
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="text-right ml-6">
                <p className="text-3xl font-bold text-blue-600">
                  ${flight.price}
                </p>
                <p className="text-xs text-gray-500 mb-3">{flight.currency}</p>
                
                <a
                  href={`https://www.google.com/travel/flights/booking?${flight.bookingToken ? `tfs=${flight.bookingToken}` : `q=Flights%20from%20${flight.origin}%20to%20${flight.destination}`}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Book on Google Flights
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-xs text-gray-500 text-center">
        Prices and availability are subject to change. Please verify on Google Flights before booking.
      </div>
    </div>
  );
}
