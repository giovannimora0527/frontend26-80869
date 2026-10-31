/**
 * Datos que se envían al backend para crear o editar un usuario.
 * El identificador no va aquí: en la edición viaja en la URL.
 */
export interface UsuarioRq {
  /** Nombre de usuario (máximo 50 caracteres). */
  username: string;
  /** Contraseña (mínimo 6). Obligatoria al crear; al editar, `null` conserva la actual. */
  password: string | null;
  /** Correo electrónico válido. */
  email: string;
  /** Id del perfil: 1 = Administrador, 2 = Recepcion, 3 = Medico. */
  rol: number;
}
