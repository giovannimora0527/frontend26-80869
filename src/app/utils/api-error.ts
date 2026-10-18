import { HttpErrorResponse } from '@angular/common/http';
import { ErrorRespuesta } from '../models/respuesta';

/**
 * Convierte cualquier error de la API en un mensaje comprensible para el usuario.
 * Usa el mensaje que envía el backend (`ErrorResponse`: status, error, message y, en errores de
 * validación, la lista `errores`) y nunca muestra detalles técnicos como URLs o trazas.
 *
 * @param error Error recibido en el callback `error` de un observable HTTP.
 * @returns Mensaje listo para mostrar.
 */
export function mensajeDeError(error: unknown): string {
  const respuesta = error as HttpErrorResponse;
  if (respuesta?.status === 0) {
    return 'No fue posible comunicarse con el servidor. Verifique su conexión e intente de nuevo.';
  }
  const cuerpo = respuesta?.error as Partial<ErrorRespuesta> | string | null;
  if (cuerpo && typeof cuerpo === 'object' && typeof cuerpo.message === 'string' && cuerpo.message.trim()) {
    const detalles = Array.isArray(cuerpo.errores) ? cuerpo.errores.filter((e) => !!e) : [];
    return detalles.length > 0 ? `${cuerpo.message} ${detalles.join(' ')}` : cuerpo.message;
  }
  switch (respuesta?.status) {
    case 400:
      return 'Revise los datos ingresados.';
    case 404:
      return 'El registro solicitado no existe.';
    case 409:
      return 'La operación no se puede realizar en el estado actual del registro.';
    case 422:
      return 'Los datos no cumplen las reglas del negocio.';
    default:
      return 'Ocurrió un error inesperado. Intente nuevamente más tarde.';
  }
}
