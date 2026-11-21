/** Cambiar contraseña con sesión iniciada. */
export interface CambiarPasswordRq {
  /** Ya no se envía al backend: el usuario sale del token de la sesión. */
  username?: string;
  passwordActual: string;
  nuevaPassword: string;
}

/** Olvidé mi contraseña, paso 1: envía un código al correo. */
export interface OlvidePasswordRq {
  username: string;
}

/** Olvidé mi contraseña, paso 2: código recibido + contraseña nueva. */
export interface RestablecerPasswordRq {
  username: string;
  codigo: string;
  nuevaPassword: string;
}
