/**
 * Usuario del sistema, tal como lo devuelve el backend.
 * El backend nunca envía la contraseña ni su hash.
 */
export class Usuario {
  /** Identificador único. */
  id?: number;
  /** Nombre de usuario para iniciar sesión (único). */
  username?: string;
  /** Correo electrónico (único); allí llega el código OTP. */
  email?: string;
  /** Id del perfil: 1 = Administrador, 2 = Recepcion, 3 = Medico. */
  rol?: number;
  /** Nombre del perfil (para mostrar en pantalla). */
  perfil?: string;
  /** `true` si el usuario puede iniciar sesión. */
  activo?: boolean;
  /** Fecha y hora de creación. */
  fechaCreacion?: Date | string;
}
