import { useState, useEffect, useCallback } from 'react';
import { fetchFuelStations } from '../utils/api';

const FUEL_LABELS = { e5: 'Super E5', e10: 'Super E10', diesel: 'Diesel', all: 'Alle' };

function PriceTag({ value }) {
  if (value == null) return <span className="text-gray-400 text-sm">–</span>;
  const [euros, cents] = value.toFixed(3).split('.');
  return (
    <span className="font-semibold text-gray-800 text-sm tabular-nums">
      {euros},{cents.slice(0, 2)}
      <sup>{cents[2]}</sup> €
    </span>
  );
}

export default function FuelStations({ position, settings, fuelStations, onStationsChange, onSelectStation, selectedStation }) {
  const stations = fuelStations || [];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!position) return;
    if (!settings.tankerkoenigKey) {
      setError('Bitte hinterlege deinen Tankerkönig API-Key in den Einstellungen.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFuelStations(
        position.lat,
        position.lng,
        settings.tankerkoenigKey,
        settings.radius,
        settings.fuelType
      );
      if (onStationsChange) onStationsChange(data);
    } catch (err) {
      setError(err.message || 'Fehler beim Laden der Tankstellen.');
    } finally {
      setLoading(false);
    }
  }, [position, settings, onStationsChange]);

  useEffect(() => {
    load();
  }, [load]);

  const priceKey = settings.fuelType === 'all' ? 'e5' : settings.fuelType;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
        <span className="text-sm text-gray-500">
          {position
            ? `${stations.length} Tankstellen (${settings.radius} km, ${FUEL_LABELS[settings.fuelType]})`
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

      {!error && stations.length === 0 && !loading && position && (
        <div className="px-4 pt-4 text-sm text-gray-400">Keine Tankstellen gefunden.</div>
      )}

      <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {stations.map((s) => (
          <li
            key={s.id}
            onClick={() => onSelectStation(s)}
            className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${
              selectedStation?.id === s.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{s.brand || s.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  {s.street} {s.houseNumber}, {s.postCode} {s.place}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{s.dist?.toFixed(1)} km entfernt</p>
              </div>
              <div className="text-right shrink-0">
                <PriceTag value={s[priceKey]} />
                <p
                  className={`text-xs mt-0.5 ${s.isOpen ? 'text-green-600' : 'text-red-500'}`}
                >
                  {s.isOpen ? 'Geöffnet' : 'Geschlossen'}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
