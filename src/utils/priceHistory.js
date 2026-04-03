const HISTORY_PREFIX = 'ph_';
const MAX_ENTRIES = 200;

const DAY_NAMES = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const DAY_NAMES_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/**
 * Save a price snapshot for a station.
 * @param {string} stationId
 * @param {number|null} e5
 * @param {number|null} e10
 * @param {number|null} diesel
 */
export function saveStationPrices(stationId, e5, e10, diesel) {
  if (!stationId) return;
  const key = HISTORY_PREFIX + stationId;
  const entry = { t: Date.now(), e5: e5 ?? null, e10: e10 ?? null, diesel: diesel ?? null };
  try {
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(entry);
    if (existing.length > MAX_ENTRIES) existing.splice(0, existing.length - MAX_ENTRIES);
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // ignore storage errors
  }
}

/**
 * Load all stored price snapshots for a station.
 * @param {string} stationId
 * @returns {{ t: number, e5: number|null, e10: number|null, diesel: number|null }[]}
 */
export function loadStationHistory(stationId) {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_PREFIX + stationId) || '[]');
  } catch {
    return [];
  }
}

function average(arr) {
  const valid = arr.filter((v) => v != null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function argMin(arr) {
  let best = null;
  arr.forEach((v, i) => {
    if (v != null && (best === null || v < arr[best])) best = i;
  });
  return best;
}

/**
 * Analyse history and return averages by hour/day plus a recommendation.
 * @param {{ t: number, e5: number|null, e10: number|null, diesel: number|null }[]} history
 * @param {'e5'|'e10'|'diesel'} fuelKey
 */
export function analyseHistory(history, fuelKey = 'e5') {
  const byHour = Array.from({ length: 24 }, () => []);
  const byDay = Array.from({ length: 7 }, () => []);

  for (const entry of history) {
    const price = entry[fuelKey];
    if (price == null) continue;
    const d = new Date(entry.t);
    byHour[d.getHours()].push(price);
    byDay[d.getDay()].push(price);
  }

  const hourAvgs = byHour.map(average);
  const dayAvgs = byDay.map(average);

  const bestHour = argMin(hourAvgs);
  const bestDay = argMin(dayAvgs);

  return { hourAvgs, dayAvgs, bestHour, bestDay, DAY_NAMES, DAY_NAMES_LONG };
}

/**
 * Build a human-readable German recommendation text.
 * Falls back to general advice when not enough data.
 * @param {{ t: number, e5: number|null, e10: number|null, diesel: number|null }[]} history
 * @param {'e5'|'e10'|'diesel'} fuelKey
 * @returns {string}
 */
export function getRecommendationText(history, fuelKey = 'e5') {
  const validCount = history.filter((e) => e[fuelKey] != null).length;

  if (validCount < 5) {
    // General advice for Germany (ADAC statistics)
    return 'Generell sind die Preise Dienstag bis Donnerstag morgens (7–9 Uhr) und spätabends (ab 21 Uhr) am günstigsten. Freitag und Samstag sind meist teurer.';
  }

  const { hourAvgs, dayAvgs, bestHour, bestDay, DAY_NAMES_LONG } = analyseHistory(history, fuelKey);
  const parts = [];

  if (bestDay !== null && dayAvgs[bestDay] != null) {
    parts.push(`Am günstigsten war es ${DAY_NAMES_LONG[bestDay]}s`);
  }
  if (bestHour !== null && hourAvgs[bestHour] != null) {
    const h = bestHour.toString().padStart(2, '0');
    parts.push(`${parts.length ? 'und ' : ''}gegen ${h}:00 Uhr`);
  }

  if (parts.length === 0) return 'Nicht genug Daten für eine Empfehlung.';
  return parts.join(' ') + ' (basierend auf gespeicherten Beobachtungen).';
}
