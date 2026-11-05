const STEP = 1024;
const MIN_GAP = 1e-6;

/**
 * Calcula la posición de un elemento colocado entre dos vecinos ya ordenados.
 * Devuelve null si no queda hueco y hay que renumerar la lista.
 */
export function positionBetween(before: number | undefined, after: number | undefined) {
  if (before === undefined && after === undefined) return STEP;
  if (before === undefined) return (after as number) - STEP;
  if (after === undefined) return before + STEP;
  if (after - before < MIN_GAP) return null;
  return (before + after) / 2;
}

/** Posiciones uniformes para renumerar una lista completa. */
export function evenPositions(count: number) {
  return Array.from({ length: count }, (_, index) => (index + 1) * STEP);
}
