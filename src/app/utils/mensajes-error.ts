import { HttpErrorResponse } from '@angular/common/http';

/**
 * Convierte un error de una llamada HTTP en un mensaje claro para el usuario.
 *
 * El backend responde los errores con la forma `{ status, error, message }`,
 * donde `message` ya viene escrito en lenguaje entendible y sin datos técnicos
 * (por ejemplo "Ya existe un cliente con el número de documento 123").
 * Esta función lo muestra tal cual; si no hay conexión o la respuesta no trae
 * mensaje, devuelve uno por defecto.
 *
 * @param error error recibido en el `subscribe`.
 * @param mensajePorDefecto texto a mostrar cuando el backend no envía uno.
 * @returns mensaje listo para mostrar en pantalla.
 */
export function obtenerMensajeError(error: unknown, mensajePorDefecto: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No hay conexión con el servidor. Verifica que el backend esté en ejecución.';
    }
    const mensaje = error.error?.message;
    if (typeof mensaje === 'string' && mensaje.trim().length > 0) {
      return mensaje;
    }
  }
  return mensajePorDefecto;
}
