import { HttpParams } from '@angular/common/http';
import { FiltroPaginado } from '../models/pagina';

/**
 * Convierte un filtro en parámetros de URL, omitiendo los vacíos.
 * @param filtro filtros del listado.
 */
export function construirParams(filtro: FiltroPaginado): HttpParams {
  let params = new HttpParams();
  Object.entries(filtro).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') {
      params = params.set(clave, String(valor));
    }
  });
  return params;
}

/**
 * Obtiene un mensaje claro para el usuario a partir de un error HTTP,
 * sin mostrar detalles técnicos.
 * @param err error recibido de HttpClient.
 * @param porDefecto mensaje si el backend no envía uno.
 */
export function mensajeError(err: unknown, porDefecto = 'Ocurrió un error. Intenta de nuevo.'): string {
  const e = err as { status?: number; error?: { message?: string; mensaje?: string } };
  if (e?.status === 0) {
    return 'No hay comunicación con el servidor. Revisa que el backend esté encendido.';
  }
  if (e?.status === 404 && !e.error?.message) {
    return 'Registro no encontrado.';
  }
  return e?.error?.message ?? e?.error?.mensaje ?? porDefecto;
}

/**
 * Convierte una fecha a texto para un input datetime-local (AAAA-MM-DDTHH:mm), en hora local.
 * @param fecha fecha o texto ISO.
 */
export function aInputFechaHora(fecha: Date | string | null | undefined): string {
  if (!fecha) {
    return '';
  }
  const d = new Date(fecha);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** Fecha y hora actuales en formato de input datetime-local. */
export function ahoraInput(): string {
  return aInputFechaHora(new Date());
}

/** Convierte AAAA-MM-DDTHH:mm del input a AAAA-MM-DDTHH:mm:00 para el backend. */
export function aFechaBackend(valor: string): string {
  return valor && valor.length === 16 ? `${valor}:00` : valor;
}
