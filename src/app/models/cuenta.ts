/**
 * Datos para registrarse. El backend crea la ficha de cliente y el usuario en un solo paso.
 */
export interface RegistroRq {
  /** Usuario: 4 a 30 caracteres (letras, números, punto, guion o guion bajo). */
  username: string;
  /** Contraseña: 8 a 100 caracteres, con al menos una letra y un número. */
  password: string;
  /** Correo donde llegan los códigos de verificación. */
  email: string;
  /** Tipo de documento: CC, CE, TI o PA. */
  tipoDocumento: string;
  /** Número de documento (5 a 20 letras o números). */
  numeroDocumento: string;
  /** Nombres. */
  nombres: string;
  /** Apellidos. */
  apellidos: string;
  /** Fecha de nacimiento (`AAAA-MM-DD`). */
  fechaNacimiento: string;
  /** Género: M, F u O (opcional). */
  genero?: string;
  /** Teléfono (opcional). */
  telefono?: string;
  /** Dirección (opcional). */
  direccion?: string;
}

/** Perfil de la persona con sesión iniciada, tal como lo devuelve el backend. */
export interface PerfilRS {
  usuarioId: number;
  username: string;
  email: string;
  /** Id del perfil de acceso: 1 = Administrador, 2 = Recepción, 3 = Médico, 4 = Cliente. */
  rol: number;
  /** Nombre del perfil de acceso. */
  perfil?: string;
  /** `CLIENTE`, `MEDICO` o vacío si el usuario aún no está asociado a una persona. */
  tipoPersona?: 'CLIENTE' | 'MEDICO' | null;
  personaId?: number;
  tipoDocumento?: string;
  numeroDocumento?: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  /** Solo para clientes. */
  direccion?: string;
}

/** Datos del perfil que la persona puede modificar por sí misma. */
export interface PerfilRq {
  email: string;
  nombres?: string;
  apellidos?: string;
  telefono?: string;
  /** Solo aplica a clientes. */
  direccion?: string;
}

/** Vincula un usuario con un cliente o un médico (solo administrador). */
export interface AsociarPersonaRq {
  usuarioId: number;
  tipoPersona: 'CLIENTE' | 'MEDICO';
  personaId: number;
}
