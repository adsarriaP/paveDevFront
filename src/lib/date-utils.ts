/**
 * Utilidades para manejo seguro de fechas sin desfase por timezone.
 * Evita usar objetos Date para formateo, trabajando directamente con strings.
 */

/**
 * Extrae la parte "YYYY-MM-DD" de cualquier formato de fecha.
 * Maneja: "2026-09-20", "2026-09-20T17:00:00.000Z", null, undefined.
 */
export function extraerFechaYMD(fecha: string | null | undefined): string {
  if (!fecha) return '';
  return fecha.split('T')[0];
}

/**
 * Convierte un string de fecha a formato de display "DD/MM/YYYY".
 * No usa objetos Date, eliminando cualquier posibilidad de desfase por timezone.
 */
export function formatFechaDisplay(fecha: string | null | undefined): string {
  if (!fecha) return '-';
  const datePart = fecha.split('T')[0];
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return '-';
  return `${day}/${month}/${year}`;
}

/**
 * Convierte un string "YYYY-MM-DD" a un objeto Date a mediodía local.
 * Útil para componentes como Calendar que necesitan Date objects.
 */
export function fechaStringToDate(fecha: string | null | undefined): Date | undefined {
  if (!fecha) return undefined;
  const datePart = fecha.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Convierte un Date a string "YYYY-MM-DD" usando componentes locales.
 * Asume que el Date fue creado a mediodía local (como lo hace fechaStringToDate).
 */
export function dateToFechaString(date: Date | null | undefined): string {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
