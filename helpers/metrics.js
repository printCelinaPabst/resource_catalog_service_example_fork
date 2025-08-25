/**
 * @file Metrik-Helferfunktionen (z. B. Durchschnittsberechnung).
 */

/**
 * Berechnet den Durchschnitt einer Zahlenliste.
 * Gibt 0 zurück, wenn die Liste leer oder nicht definiert ist.
 * @param {number[]} values
 * @returns {number}
 */
export function average(values) {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + Number(b), 0);
  return sum / values.length;
}
