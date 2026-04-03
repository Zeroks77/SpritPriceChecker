import { useMemo } from 'react';
import { formatPrice } from '../utils/format';
import { loadStationHistory, analyseHistory, getRecommendationText } from '../utils/priceHistory';

const FUEL_KEYS = ['e5', 'e10', 'diesel'];
const FUEL_LABELS = { e5: 'Super E5', e10: 'Super E10', diesel: 'Diesel' };
const FUEL_COLORS = { e5: 'text-blue-700', e10: 'text-green-700', diesel: 'text-orange-700' };
const FUEL_BG = { e5: 'bg-blue-50 ring-blue-200', e10: 'bg-green-50 ring-green-200', diesel: 'bg-orange-50 ring-orange-200' };
const FUEL_STROKES = { e5: '#2563eb', e10: '#16a34a', diesel: '#ea580c' };

function formatHistoryLabel(timestamp) {
  return new Date(timestamp).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PriceCard({ label, value, colorClass, bgClass }) {
  if (value == null) return null;
  const [euros, cents] = value.toFixed(3).split('.');
  return (
    <div className={`flex flex-col items-center rounded-xl p-3 ring-1 ${bgClass}`}>
      <span className="text-[11px] text-gray-500 font-medium mb-1">{label}</span>
      <span className={`font-bold tabular-nums text-xl leading-none ${colorClass}`}>
        {euros},{cents.slice(0, 2)}<sup className="text-xs align-super">{cents[2]}</sup>
        <span className="text-sm font-semibold ml-0.5">€</span>
      </span>
    </div>
  );
}

function HistoryLineChart({ history, fuelKeys }) {
  const chartData = history
    .filter((entry) => fuelKeys.some((key) => entry[key] != null))
    .slice(-30);
  const firstPoint = chartData[0];
  const lastPoint = chartData[chartData.length - 1];
  const startLabel = firstPoint ? formatHistoryLabel(firstPoint.t) : '';
  const endLabel = lastPoint ? formatHistoryLabel(lastPoint.t) : '';

  if (chartData.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-xs text-gray-400">
        Für den Linienverlauf werden mindestens zwei gespeicherte Preisstände benötigt.
      </div>
    );
  }

  const width = 320;
  const height = 140;
  const padding = { top: 12, right: 8, bottom: 22, left: 8 };
  const minTime = chartData[0].t;
  const maxTime = chartData[chartData.length - 1].t;
  const timeRange = Math.max(maxTime - minTime, 1000);
  const validPrices = chartData.flatMap((entry) => fuelKeys.map((key) => entry[key]).filter((value) => value != null));

  if (validPrices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-xs text-gray-400">
        Noch keine historischen Preise für diese Auswahl gespeichert.
      </div>
    );
  }

  const minPrice = Math.min(...validPrices);
  const maxPrice = Math.max(...validPrices);
  const priceRange = maxPrice - minPrice || 0.01;

  const xFor = (timestamp) => (
    padding.left + ((timestamp - minTime) / timeRange) * (width - padding.left - padding.right)
  );
  const yFor = (price) => (
    height - padding.bottom - ((price - minPrice) / priceRange) * (height - padding.top - padding.bottom)
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-[11px] text-gray-400">
        <span>{formatPrice(maxPrice)}</span>
        <span>{chartData.length} Messpunkte</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" role="img">
        <title>Historischer Preisverlauf</title>
        <desc>{`${fuelKeys.map((key) => FUEL_LABELS[key]).join(', ')} von ${startLabel} bis ${endLabel}`}</desc>
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#d1d5db"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
        {fuelKeys.map((key) => {
          const points = chartData
            .filter((entry) => entry[key] != null)
            .map((entry) => `${xFor(entry.t)},${yFor(entry[key])}`)
            .join(' ');

          if (!points) return null;

          return (
            <polyline
              key={key}
              fill="none"
              stroke={FUEL_STROKES[key]}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={points}
            />
          );
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-gray-400">
        <span>{startLabel}</span>
        <span>{formatPrice(minPrice)}</span>
        <span>{endLabel}</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {fuelKeys.map((key) => (
          <span
            key={key}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${FUEL_BG[key]} ${FUEL_COLORS[key]}`}
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: FUEL_STROKES[key] }}
            />
            {FUEL_LABELS[key]}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function StationDetail({ station, settings, onClose, onPlanRoute, onFocusStation }) {
  const fuelKey = settings?.fuelType === 'all' ? 'e5' : (settings?.fuelType || 'e5');
  const history = useMemo(() => loadStationHistory(station.id), [station.id]);
  const analysis = useMemo(
    () => (history.length > 0 ? analyseHistory(history, fuelKey) : null),
    [history, fuelKey]
  );
  const recommendation = useMemo(() => getRecommendationText(history, fuelKey), [history, fuelKey]);
  const historyKeys = settings?.fuelType === 'all' ? FUEL_KEYS : [fuelKey];
  const lastObservation = history.at(-1);

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 shrink-0 bg-white">
        <button
          onClick={onClose}
          aria-label="Zurück zur Stationsliste"
          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium touch-manipulation py-1 pr-2"
        >
          <span aria-hidden="true">←</span> Zurück
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm truncate">{station.brand || station.name}</p>
          <p className="text-xs text-gray-400 truncate">{station.street} {station.houseNumber}, {station.postCode} {station.place}</p>
        </div>
        <span
          className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
            station.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}
        >
          {station.isOpen ? 'Geöffnet' : 'Geschlossen'}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scroll-touch px-4 py-3 flex flex-col gap-4">

        {/* Current prices */}
        <section>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Aktuelle Preise</h3>
          <div className="grid grid-cols-3 gap-2">
            {FUEL_KEYS.map((key) =>
              station[key] != null ? (
                <PriceCard
                  key={key}
                  label={FUEL_LABELS[key]}
                  value={station[key]}
                  colorClass={FUEL_COLORS[key]}
                  bgClass={FUEL_BG[key]}
                />
              ) : null
            )}
          </div>
          {FUEL_KEYS.every((k) => station[k] == null) && (
            <p className="text-xs text-gray-400">Keine Preise verfügbar.</p>
          )}
        </section>

        {/* Historical analysis */}
        {analysis && (
          <section>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Historischer Preisverlauf
              </h3>
              <span className="text-[11px] text-gray-400">
                {history.length} Beobachtungen
              </span>
            </div>
            <HistoryLineChart history={history} fuelKeys={historyKeys} />
            {lastObservation && (
              <p className="text-[11px] text-gray-400 mt-2">
                Letzte Aktualisierung: {formatHistoryLabel(lastObservation.t)}
              </p>
            )}
          </section>
        )}

        {/* Recommendation */}
        <section className="bg-amber-50 rounded-xl p-3 ring-1 ring-amber-200">
          <h3 className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
            <span aria-hidden="true">💡</span> Kaufempfehlung
          </h3>
          <p className="text-xs text-amber-900 leading-relaxed">{recommendation}</p>
        </section>

        {/* Show on map button */}
        {onFocusStation && (
          <button
            onClick={() => onFocusStation(station)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm py-3 rounded-xl transition-colors touch-manipulation flex items-center justify-center gap-2"
          >
            <span aria-hidden="true">📍</span> Auf Karte anzeigen
          </button>
        )}

        {/* Route button */}
        <button
          onClick={() => onPlanRoute(station)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors touch-manipulation flex items-center justify-center gap-2"
        >
          <span aria-hidden="true">🗺️</span> Route planen
        </button>
      </div>
    </div>
  );
}
