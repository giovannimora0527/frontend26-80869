/**
 * Devuelve la fecha de hoy en formato yyyy-MM-dd usando la zona horaria local.
 *
 * @returns Fecha actual como texto.
 */
export function hoy(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
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
