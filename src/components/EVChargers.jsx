import { useState, useEffect, useCallback } from 'react';
import { fetchEVChargers } from '../utils/api';

function ConnectionBadge({ quantity }) {
  return (
    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
      ⚡ {quantity} Anschluss{quantity !== 1 ? 'e' : ''}
    </span>
  );
}

export default function EVChargers({ position, settings, evChargers, onChargersChange, onSelectCharger, selectedCharger }) {
  const chargers = evChargers || [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!position) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEVChargers(
        position.lat,
        position.lng,
        settings.openChargeMapKey,
        settings.radius
      );
      if (onChargersChange) onChargersChange(data);
    } catch (err) {
      setError(err.message || 'Fehler beim Laden der Ladesäulen.');
    } finally {
      setLoading(false);
    }
  }, [position, settings, onChargersChange]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <span className="text-sm text-gray-500">
          {position
            ? `${chargers.length} Ladesäulen (${settings.radius} km)`
            : 'Kein Standort gewählt'}
        </span>
        <button
          onClick={load}
          disabled={loading || !position}
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40 font-medium"
        >
          {loading ? 'Lädt…' : 'Aktualisieren'}
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {!error && chargers.length === 0 && !loading && position && (
        <div className="px-4 pt-4 text-sm text-gray-400">Keine Ladesäulen gefunden.</div>
      )}

      <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {chargers.map((c) => {
          const totalConnections = c.Connections?.reduce(
            (sum, conn) => sum + (conn.Quantity || 1),
            0
          ) ?? 0;
          const isOperational = c.StatusType?.IsOperational !== false;
          const address = c.AddressInfo;

          return (
            <li
              key={c.ID}
              onClick={() => onSelectCharger(c)}
              className={`px-4 py-3 cursor-pointer hover:bg-green-50 transition-colors ${
                selectedCharger?.ID === c.ID ? 'bg-green-50 border-l-4 border-green-500' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {address?.Title || 'Ladesäule'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {address?.AddressLine1}, {address?.Postcode} {address?.Town}
                  </p>
                  {address?.Distance != null && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {address.Distance.toFixed(1)} km entfernt
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0 flex flex-col gap-1 items-end">
                  <ConnectionBadge quantity={totalConnections} />
                  <span
                    className={`text-xs ${isOperational ? 'text-green-600' : 'text-red-500'}`}
                  >
                    {isOperational ? 'In Betrieb' : 'Außer Betrieb'}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
