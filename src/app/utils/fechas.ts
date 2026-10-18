/**
 * Completa con cero a la izquierda un número de fecha u hora.
 *
 * @param n Número a formatear.
 * @returns Texto de dos dígitos.
 */
function dos(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Devuelve la fecha de hoy en formato yyyy-MM-dd usando la zona horaria local.
 *
 * @returns Fecha actual como texto.
 */
export function hoy(): string {
  const ahora = new Date();
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`;
}

/**
 * Devuelve la fecha y hora actuales en el formato de `input type="datetime-local"`
 * (yyyy-MM-ddTHH:mm) usando la zona horaria local.
 *
 * @returns Fecha y hora actual como texto.
 */
export function ahoraLocal(): string {
  const ahora = new Date();
  return `${hoy()}T${dos(ahora.getHours())}:${dos(ahora.getMinutes())}`;
}

/**
 * Une una fecha (yyyy-MM-dd) y una hora (HH:mm o HH:mm:ss) en formato ISO local.
 *
 * @param fecha Fecha del input type="date".
 * @param hora Hora del input type="time".
 * @returns Texto yyyy-MM-ddTHH:mm:ss.
 */
export function unirFechaHora(fecha: string, hora: string): string {
  return `${fecha}T${hora.length === 5 ? hora + ':00' : hora}`;
}

/**
 * Completa los segundos de un valor `datetime-local` para enviarlo al backend como ISO local.
 *
 * @param valor Texto yyyy-MM-ddTHH:mm (o con segundos).
 * @returns Texto yyyy-MM-ddTHH:mm:ss.
 */
export function aIsoLocal(valor: string): string {
  return valor.length === 16 ? `${valor}:00` : valor;
}
