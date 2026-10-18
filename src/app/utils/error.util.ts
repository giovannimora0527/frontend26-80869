import { HttpErrorResponse } from '@angular/common/http';
import { ErrorBackend } from '../models/pagina';

/**
 * Convierte cualquier error HTTP en un mensaje legible para el usuario.
 * El backend responde `{ status, error, message }`; si no hay conexión se explica con claridad.
 */
export function mensajeDeError(error: unknown, porDefecto = 'No fue posible completar la operación.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No hay conexión con el servidor. Verifique que el backend esté en ejecución.';
    }
    const cuerpo = error.error as ErrorBackend | string | null;
    if (cuerpo && typeof cuerpo === 'object' && cuerpo.message) {
      return cuerpo.message;
    }
    if (typeof cuerpo === 'string' && cuerpo.trim()) {
      return cuerpo;
    }
    if (error.status >= 500) {
      return 'Ocurrió un error inesperado en el servidor. Intente nuevamente.';
    }
  }
  return porDefecto;
}
