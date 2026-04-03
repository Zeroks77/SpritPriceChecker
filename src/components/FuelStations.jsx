import { useState, useEffect, useCallback } from 'react';
import { fetchFuelStations } from '../utils/api';

// Short badge labels (fit in compact price badge); long labels for status bar / aria
const FUEL_LABELS = { e5: 'Super E5', e10: 'Super E10', diesel: 'Diesel', all: 'Alle' };
const FUEL_BADGE_LABELS = { e5: 'E5', e10: 'E10', diesel: 'Diesel' };
const FUEL_KEYS = ['e5', 'e10', 'diesel'];

function PriceTag({ value, highlight, delta }) {
  if (value == null) return <span className="text-gray-300 text-sm">–</span>;
  const [euros, cents] = value.toFixed(3).split('.');
  return (
    <span className={`inline-flex flex-col items-end ${highlight ? 'text-green-700' : 'text-gray-800'}`}>
      <span className={`font-bold tabular-nums leading-none ${highlight ? 'text-base' : 'text-sm'}`}>
        {euros},{cents.slice(0, 2)}<sup className="text-[0.6em]">{cents[2]}</sup> €
      </span>
      {delta != null && delta > 0 && (
        <span className="text-[10px] text-red-500 font-medium leading-none mt-0.5">
          +{delta.toFixed(2).replace('.', ',')} €
        </span>
      )}
    </span>
  );
}

function PriceBadge({ label, value, highlight, delta }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-[52px] ${
      highlight ? 'bg-green-50 ring-1 ring-green-300' : 'bg-gray-50'
    }`}>
      <span className="text-[10px] text-gray-400 font-medium">{label}</span>
      <PriceTag value={value} highlight={highlight} delta={delta} />
    </div>
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

  const showAll = settings.fuelType === 'all';
  const priceKey = showAll ? 'e5' : settings.fuelType;

  // Compute cheapest price per fuel key for delta highlighting
  const cheapest = {};
  if (showAll) {
    for (const key of FUEL_KEYS) {
      const prices = stations.map((s) => s[key]).filter((v) => v != null);
      cheapest[key] = prices.length > 0 ? Math.min(...prices) : null;
    }
  } else {
    const prices = stations.map((s) => s[priceKey]).filter((v) => v != null);
    cheapest[priceKey] = prices.length > 0 ? Math.min(...prices) : null;
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
        <span aria-live="polite" aria-atomic="true" className="text-xs text-gray-500 truncate mr-2">
          {position
            ? loading
              ? 'Lädt Tankstellen…'
              : `${stations.length} Stationen · ${settings.radius} km · ${FUEL_LABELS[settings.fuelType]}`
            : 'Kein Standort gewählt'}
        </span>
        <button
          onClick={load}
          disabled={loading || !position}
          aria-label="Tankstellen neu laden"
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

      {!error && stations.length === 0 && !loading && position && (
        <p className="px-4 pt-4 text-sm text-gray-400">Keine Tankstellen gefunden.</p>
      )}

      <ul aria-label="Tankstellen in der Nähe" className="flex-1 overflow-y-auto divide-y divide-gray-100 scroll-touch">
        {stations.map((s, idx) => {
          const isSelected = selectedStation?.id === s.id;
          const isCheapest = cheapest[priceKey] != null && s[priceKey] === cheapest[priceKey];

          return (
            <li key={s.id}>
              <button
                onClick={() => onSelectStation(s)}
                aria-current={isSelected ? 'true' : undefined}
                aria-label={`${s.brand || s.name}, ${s.dist?.toFixed(1)} km entfernt, ${s.isOpen ? 'Geöffnet' : 'Geschlossen'}`}
                className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-l-4 ${
                  isSelected ? 'bg-blue-50 border-blue-500' : 'border-transparent'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Station info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-gray-800 text-sm truncate">{s.brand || s.name}</p>
                      {isCheapest && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          🏆 Günstigste
                        </span>
                      )}
                      {idx === 0 && !isCheapest && s.dist != null && (
                        <span className="shrink-0 text-[10px] text-blue-500 font-medium">Nächste</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {s.street} {s.houseNumber}, {s.postCode} {s.place}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-400">{s.dist?.toFixed(1)} km</p>
                      <span className={`text-xs font-medium ${s.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                        {s.isOpen ? 'Geöffnet' : 'Geschlossen'}
                      </span>
                    </div>
                  </div>

                  {/* Price area */}
                  <div className="shrink-0 flex flex-col items-end gap-1" aria-hidden="true">
                    {showAll ? (
                      /* All fuels: show 3 price badges side by side */
                      <div className="flex gap-1">
                        {FUEL_KEYS.map((key) => {
                          const isMin = cheapest[key] != null && s[key] === cheapest[key];
                          const delta = s[key] != null && cheapest[key] != null ? s[key] - cheapest[key] : null;
                          return (
                            <PriceBadge
                              key={key}
                              label={FUEL_BADGE_LABELS[key]}
                              value={s[key]}
                              highlight={isMin}
                              delta={delta}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      /* Single fuel: larger price display */
                      <PriceTag
                        value={s[priceKey]}
                        highlight={isCheapest}
                        delta={
                          s[priceKey] != null && cheapest[priceKey] != null
                            ? s[priceKey] - cheapest[priceKey]
                            : null
                        }
                      />
                    )}
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
