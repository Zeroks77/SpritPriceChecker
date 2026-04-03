import { useState, useCallback, useEffect } from 'react';
import { fetchRoute } from '../utils/api';

const PROFILES = [
  { value: 'driving-car',     emoji: '🚗', label: 'Auto'    },
  { value: 'cycling-regular', emoji: '🚴', label: 'Fahrrad' },
  { value: 'foot-walking',    emoji: '🚶', label: 'Zu Fuß'  },
];

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h} Std. ${m} Min.` : `${m} Min.`;
}

function formatDistance(meters) {
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1)} km`
    : `${Math.round(meters)} m`;
}

// Label for each alternative route index
function routeLabel(idx, total) {
  if (total <= 1) return 'Route';
  if (idx === 0) return 'Schnellste Route';
  if (idx === 1) return 'Alternative 1';
  if (idx === 2) return 'Alternative 2';
  return `Alternative ${idx}`;
}

// Route card colours matching the map lines
const ROUTE_COLORS = ['#2563eb', '#ea580c', '#7c3aed'];

export default function RoutingControl({
  position,
  destination,
  settings,
  routeData,
  selectedRouteIndex,
  onRouteReady,
  onSelectRoute,
}) {
  const [profile, setProfile] = useState('driving-car');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calcTime, setCalcTime] = useState(null);

  const summaries = routeData?.features?.map((f) => f.properties?.summary) ?? [];
  const canRoute = position && destination;

  const calculateRoute = useCallback(async () => {
    if (!position || !destination) return;
    if (!settings.orsKey) {
      setError('Bitte hinterlege deinen OpenRouteService API-Key in den Einstellungen.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const from = [position.lng, position.lat];
      const to = [destination.lng, destination.lat];
      const data = await fetchRoute(from, to, settings.orsKey, profile);
      if (onRouteReady) onRouteReady(data);
      setCalcTime(new Date());
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Route konnte nicht berechnet werden.');
    } finally {
      setLoading(false);
    }
  }, [position, destination, settings.orsKey, profile, onRouteReady]);

  // Auto-calculate whenever destination or profile changes
  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  return (
    <div className="flex flex-col gap-3 overflow-y-auto h-full p-4 scroll-touch">
      <h2 className="text-sm font-bold text-gray-800 shrink-0">Routenplanung</h2>

      {!canRoute && (
        <p className="text-xs text-gray-400">
          Wähle zuerst einen Standort und tippe dann auf eine Tankstelle oder Ladesäule.
        </p>
      )}

      {canRoute && (
        <>
          {/* Transport profile selector */}
          <div role="group" aria-label="Fortbewegungsmittel" className="flex gap-2 shrink-0">
            {PROFILES.map((p) => (
              <button
                key={p.value}
                onClick={() => setProfile(p.value)}
                aria-pressed={profile === p.value}
                className={`flex-1 text-xs py-2.5 rounded-lg border transition-colors touch-manipulation ${
                  profile === p.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-blue-400'
                }`}
              >
                <span aria-hidden="true">{p.emoji}</span>
                {' '}{p.label}
              </button>
            ))}
          </div>

          {/* Route info */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2.5 shrink-0">
            <p className="truncate">
              <span className="font-medium">Von:</span>{' '}
              {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </p>
            <p className="truncate">
              <span className="font-medium">Nach:</span>{' '}
              {destination.name || 'Ziel'}
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-blue-600 shrink-0">
              <span className="animate-spin text-base" aria-hidden="true">⟳</span>
              Route wird berechnet…
            </div>
          )}

          {/* Error */}
          {error && (
            <div role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 shrink-0">
              {error}
              <button
                onClick={calculateRoute}
                className="block mt-1 text-red-700 underline font-medium text-xs"
              >
                Erneut versuchen
              </button>
            </div>
          )}

          {/* Alternative route cards */}
          {summaries.length > 0 && !loading && (
            <div className="flex flex-col gap-2">
              {summaries.map((summary, idx) => {
                if (!summary) return null;
                const isSelected = idx === selectedRouteIndex;
                const color = ROUTE_COLORS[idx] ?? '#6b7280';
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectRoute && onSelectRoute(idx)}
                    aria-pressed={isSelected}
                    aria-label={`${routeLabel(idx, summaries.length)}: ${formatDistance(summary.distance)}, ${formatDuration(summary.duration)}`}
                    className={`w-full text-left rounded-xl border-2 p-3 transition-all touch-manipulation ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-100 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Colour swatch matching map line */}
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                        <span className={`text-xs font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                          {routeLabel(idx, summaries.length)}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded-full shrink-0">
                          Aktiv
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-3 mt-1.5 pl-5">
                      <span className="text-base font-bold text-gray-800">
                        {formatDistance(summary.distance)}
                      </span>
                      <span className="text-sm text-gray-500">
                        <span aria-hidden="true">⏱</span> {formatDuration(summary.duration)}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Traffic / data note */}
              <p className="text-[11px] text-gray-400 leading-snug pt-1">
                <span aria-hidden="true">ℹ️</span>{' '}
                Route basiert auf historischen Geschwindigkeitsprofilen (OSM).
                {calcTime && (
                  <> Berechnet um {calcTime.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr.</>
                )}
              </p>

              {/* Manual recalculate */}
              <button
                onClick={calculateRoute}
                disabled={loading}
                className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40 font-medium py-1 touch-manipulation"
              >
                🔄 Route neu berechnen
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
