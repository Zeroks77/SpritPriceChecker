import { useState, useCallback } from 'react';
import { fetchRoute } from '../utils/api';

const PROFILES = [
  { value: 'driving-car', label: '🚗 Auto' },
  { value: 'cycling-regular', label: '🚴 Fahrrad' },
  { value: 'foot-walking', label: '🚶 Zu Fuß' },
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

export default function RoutingControl({ position, destination, settings, onRouteReady }) {
  const [profile, setProfile] = useState('driving-car');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateRoute = useCallback(async () => {
    if (!position || !destination) return;
    if (!settings.orsKey) {
      setError('Bitte hinterlege deinen OpenRouteService API-Key in den Einstellungen.');
      return;
    }
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const from = [position.lng, position.lat];
      const to = [destination.lng, destination.lat];
      const data = await fetchRoute(from, to, settings.orsKey, profile);
      const seg = data.features?.[0]?.properties?.summary;
      setSummary(seg);
      if (onRouteReady) onRouteReady(data);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Route konnte nicht berechnet werden.');
    } finally {
      setLoading(false);
    }
  }, [position, destination, settings.orsKey, profile, onRouteReady]);

  const canRoute = position && destination;

  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="text-sm font-bold text-gray-800">Routenplanung</h2>

      {!canRoute && (
        <p className="text-xs text-gray-400">
          Wähle zuerst einen Standort und klicke dann auf eine Tankstelle oder Ladesäule.
        </p>
      )}

      {canRoute && (
        <>
          <div className="flex gap-2">
            {PROFILES.map((p) => (
              <button
                key={p.value}
                onClick={() => setProfile(p.value)}
                className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${
                  profile === p.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-blue-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">
            <p>
              <span className="font-medium">Von:</span> {position.lat.toFixed(5)},{' '}
              {position.lng.toFixed(5)}
            </p>
            <p>
              <span className="font-medium">Nach:</span> {destination.name || 'Ziel'}
            </p>
          </div>

          <button
            onClick={calculateRoute}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
          >
            {loading ? 'Berechne Route…' : 'Route berechnen'}
          </button>
        </>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      {summary && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm text-green-800">
          <p className="font-semibold mb-1">Routenzusammenfassung</p>
          <p>🛣️ Distanz: <strong>{formatDistance(summary.distance)}</strong></p>
          <p>⏱️ Dauer: <strong>{formatDuration(summary.duration)}</strong></p>
        </div>
      )}
    </div>
  );
}
