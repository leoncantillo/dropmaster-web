const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

/**
 * Formats a number as Colombian pesos, e.g. $ 22.000.
 */
export function formatCOP(value: number): string {
  return copFormatter.format(value);
}

/**
 * Formats a percentage value (already in percent units, e.g. 46 for 46%),
 * e.g. 46,7%.
 */
export function formatPercent(value: number): string {
  return `${value.toLocaleString('es-CO', { maximumFractionDigits: 2 })}%`;
}
