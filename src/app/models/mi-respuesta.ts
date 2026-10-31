/**
 * Respuesta simple que devuelve el backend al crear, editar o cambiar el estado de un registro.
 */
export interface MiRespuesta {
  /** Código de resultado (200 = correcto, 201 = creado). */
  status: number;
  /** Mensaje de confirmación para mostrar al usuario. */
  message: string;
}
