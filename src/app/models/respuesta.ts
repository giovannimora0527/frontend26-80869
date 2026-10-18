/**
 * Respuesta estándar del backend para operaciones de escritura (POST, PUT, PATCH).
 * Corresponde a `MiRespuestaRS`: trae un mensaje listo para el usuario y el registro afectado.
 */
export interface MiRespuestaRS<T> {
  /** Código HTTP lógico (201 al crear, 200 al actualizar). */
  status: number;
  /** Mensaje comprensible para el usuario. */
  message: string;
  /** Registro creado o modificado. */
  data: T;
}

/**
 * Cuerpo de error que envía el backend (`GlobalExceptionHandler`) en las respuestas 4xx/5xx.
 */
export interface ErrorRespuesta {
  /** Código HTTP. */
  status: number;
  /** Nombre del estado HTTP (BAD REQUEST, CONFLICT, ...). */
  error: string;
  /** Mensaje comprensible para el usuario. */
  message: string;
  /** Fecha y hora del error. */
  timestamp?: string;
  /** Detalle de campos inválidos (solo en errores de validación 400). */
  errores?: string[] | null;
}
