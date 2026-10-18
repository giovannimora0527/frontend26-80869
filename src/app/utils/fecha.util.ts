/** Rellena con ceros a la izquierda. */
const dos = (n: number): string => String(n).padStart(2, '0');

/** Fecha local en formato `yyyy-MM-dd` (la que usan los `<input type="date">`). */
export function fechaIso(d: Date = new Date()): string {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** Hora local en formato `HH:mm` (la que usan los `<input type="time">`). */
export function horaIso(d: Date = new Date()): string {
  return `${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** Separa un `LocalDateTime` del backend (`2026-10-17T10:30:00`) en fecha y hora. */
export function separarFechaHora(fechaHora: string | null | undefined): { fecha: string; hora: string } {
  if (!fechaHora) {
    return { fecha: '', hora: '' };
  }
  const [fecha, resto = ''] = fechaHora.split('T');
  return { fecha, hora: resto.substring(0, 5) };
}

/** Texto amigable `dd/MM/yyyy HH:mm` para mostrar en tablas y detalles. */
export function formatearFechaHora(fechaHora: string | null | undefined): string {
  if (!fechaHora) {
    return '';
  }
  const { fecha, hora } = separarFechaHora(fechaHora);
  const [a, m, d] = fecha.split('-');
  return hora ? `${d}/${m}/${a} ${hora}` : `${d}/${m}/${a}`;
}

/** `true` si la fecha y hora (locales) ya pasaron. */
export function esPasada(fecha: string, hora: string): boolean {
  if (!fecha) {
    return false;
  }
  return new Date(`${fecha}T${hora || '00:00'}:00`).getTime() < Date.now();
}
