import { useMemo } from 'react';
import { formatPrice } from '../utils/format';
import { loadStationHistory, analyseHistory, getRecommendationText } from '../utils/priceHistory';

const FUEL_KEYS = ['e5', 'e10', 'diesel'];
const FUEL_LABELS = { e5: 'Super E5', e10: 'Super E10', diesel: 'Diesel' };
const FUEL_COLORS = { e5: 'text-blue-700', e10: 'text-green-700', diesel: 'text-orange-700' };
const FUEL_BG = { e5: 'bg-blue-50 ring-blue-200', e10: 'bg-green-50 ring-green-200', diesel: 'bg-orange-50 ring-orange-200' };

const DAY_ABBR = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

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

function MiniBarChart({ values, labels, highlightIndex }) {
  const validValues = values.filter((v) => v != null);
  if (validValues.length === 0) return null;
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-px" style={{ height: 40 }}>
      {values.map((v, i) => {
        if (v == null) {
          return <div key={i} className="flex-1" />;
        }
        const pct = ((v - min) / range) * 70 + 30; // 30%–100%
        const isHighlight = i === highlightIndex;
        return (
          <div
            key={i}
            title={`${labels[i]}: ${formatPrice(v)}`}
            className={`flex-1 rounded-t transition-colors ${isHighlight ? 'bg-green-500' : 'bg-blue-200'}`}
            style={{ height: `${pct}%` }}
          />
        );
      })}
    </div>
  );
}

export default function StationDetail({ station, settings, onClose, onPlanRoute }) {
  const fuelKey = settings?.fuelType === 'all' ? 'e5' : (settings?.fuelType || 'e5');
  const history = useMemo(() => loadStationHistory(station.id), [station.id]);
  const analysis = useMemo(
    () => (history.length > 0 ? analyseHistory(history, fuelKey) : null),
    [history, fuelKey]
  );
  const recommendation = useMemo(() => getRecommendationText(history, fuelKey), [history, fuelKey]);

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
          <>
            {/* By day of week */}
            {analysis.dayAvgs.some((v) => v != null) && (
              <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Ø Preis nach Wochentag
                </h3>
                <MiniBarChart
                  values={analysis.dayAvgs}
                  labels={DAY_ABBR}
                  highlightIndex={analysis.bestDay}
                />
                <div className="flex mt-0.5">
                  {DAY_ABBR.map((d, i) => (
                    <div
                      key={i}
                      className={`flex-1 text-center text-[10px] font-medium ${
                        i === analysis.bestDay ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* By hour */}
            {analysis.hourAvgs.some((v) => v != null) && (
              <section>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Ø Preis nach Uhrzeit
                </h3>
                <MiniBarChart
                  values={analysis.hourAvgs}
                  labels={Array.from({ length: 24 }, (_, i) => `${i}:00`)}
                  highlightIndex={analysis.bestHour}
                />
                <div className="flex mt-0.5">
                  <div className="flex w-full">
                    {['0', '6', '12', '18', '23'].map((h) => (
                      <div key={h} className="flex-1 text-[10px] text-gray-400 text-center first:text-left last:text-right">
                        {h}h
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {history.length} gespeicherte Beobachtungen
                </p>
              </section>
            )}
          </>
        )}

        {/* Recommendation */}
        <section className="bg-amber-50 rounded-xl p-3 ring-1 ring-amber-200">
          <h3 className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
            <span aria-hidden="true">💡</span> Kaufempfehlung
          </h3>
          <p className="text-xs text-amber-900 leading-relaxed">{recommendation}</p>
        </section>

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
