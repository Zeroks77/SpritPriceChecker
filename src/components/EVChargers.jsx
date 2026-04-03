import { useState, useEffect, useCallback } from 'react';
import { fetchEVChargers } from '../utils/api';

function ConnectionBadge({ quantity }) {
  return (
    <span
      aria-label={`${quantity} Anschluss${quantity !== 1 ? 'e' : ''}`}
      className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full"
    >
      <span aria-hidden="true">⚡</span>
      {quantity} Anschluss{quantity !== 1 ? 'e' : ''}
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
        <span aria-live="polite" aria-atomic="true" className="text-xs text-gray-500 truncate mr-2">
          {position
            ? loading
              ? 'Lädt Ladesäulen…'
              : `${chargers.length} Ladesäulen · ${settings.radius} km`
            : 'Kein Standort gewählt'}
        </span>
        <button
          onClick={load}
          disabled={loading || !position}
          aria-label="Ladesäulen neu laden"
          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40 font-medium py-1 px-2 shrink-0"
        >
          {loading ? 'Lädt…' : 'Aktualisieren'}
        </button>
      </div>

      {error && (
        <div role="alert" className="mx-4 mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {!error && chargers.length === 0 && !loading && position && (
        <p className="px-4 pt-4 text-sm text-gray-400">Keine Ladesäulen gefunden.</p>
      )}

      <ul aria-label="Ladesäulen in der Nähe" className="flex-1 overflow-y-auto divide-y divide-gray-100 scroll-touch">
        {chargers.map((c) => {
          const totalConnections = c.Connections?.reduce(
            (sum, conn) => sum + (conn.Quantity || 1),
            0
          ) ?? 0;
          const isOperational = c.StatusType?.IsOperational !== false;
          const address = c.AddressInfo;
          const isSelected = selectedCharger?.ID === c.ID;

          return (
            <li key={c.ID}>
              <button
                onClick={() => onSelectCharger(c)}
                aria-current={isSelected ? 'true' : undefined}
                aria-label={`${address?.Title || 'Ladesäule'}, ${totalConnections} Anschluss${totalConnections !== 1 ? 'e' : ''}, ${isOperational ? 'In Betrieb' : 'Außer Betrieb'}`}
                className={`w-full text-left px-4 py-3 hover:bg-green-50 transition-colors border-l-4 ${
                  isSelected ? 'bg-green-50 border-green-500' : 'border-transparent'
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
                  <div className="text-right shrink-0 flex flex-col gap-1 items-end" aria-hidden="true">
                    <ConnectionBadge quantity={totalConnections} />
                    <span className={`text-xs ${isOperational ? 'text-green-600' : 'text-red-500'}`}>
                      {isOperational ? 'In Betrieb' : 'Außer Betrieb'}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
