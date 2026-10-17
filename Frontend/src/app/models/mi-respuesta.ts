/**
 * Modelo generico de respuesta del backend para operaciones de escritura.
 * Coincide con la clase MiRespuestaRS del backend.
 */
export class MiRespuesta {
  /** Codigo de estado de la operacion. */
  status?: number;
  /** Mensaje descriptivo del resultado. */
  message?: string;
}
