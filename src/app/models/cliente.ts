/**
 * Cliente de la clínica (dueño de una o varias mascotas), tal como lo devuelve el backend.
 */
export class Cliente {
  /** Identificador único. */
  id?: number;
  /** Tipo de documento: CC, CE, TI o PA. */
  tipoDocumento?: string;
  /** Número de documento (único). */
  numeroDocumento?: string;
  /** Nombres del cliente. */
  nombres?: string;
  /** Apellidos del cliente. */
  apellidos?: string;
  /** Dirección de residencia (opcional). */
  direccion?: string;
  /** Fecha de nacimiento (`AAAA-MM-DD`). */
  fechaNacimiento?: Date | string;
  /** Género: M, F u O (opcional). */
  genero?: string;
  /** Teléfono de contacto (opcional). */
  telefono?: string;
  /** `true` si el cliente está activo; los inactivos no pueden agendar citas. */
  activo?: boolean;
  /** Usuario del sistema asociado (opcional). */
  usuarioId?: number;
}
