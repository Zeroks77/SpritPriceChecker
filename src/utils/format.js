/**
 * Format a fuel price (in EUR, 3 decimal places) as a German-formatted string.
 * Example: 1.799 → "1,79⁹ €"
 * Returns '–' for null/undefined.
 */
export function formatPrice(value) {
  if (value == null) return '–';
  const [euros, cents] = value.toFixed(3).split('.');
  // Non-breaking zero-width joiner keeps the superscript digit attached
  return `${euros},${cents.slice(0, 2)}\u2060${cents[2]} €`;
}

/**
 * Format a fuel price delta as a German decimal string.
 * Example: 0.032 → "+0,03 €"
 */
export function formatPriceDelta(delta) {
  return '+' + delta.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}
