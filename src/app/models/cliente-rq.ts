/**
 * Datos que se envían al backend para crear o editar un cliente.
 * El identificador no va aquí: en la edición viaja en la URL.
 */
export interface ClienteRq {
  /** Tipo de documento: CC, CE, TI o PA. */
  tipoDocumento: string;
  /** Número de documento (5 a 20 letras o números). */
  numeroDocumento: string;
  /** Nombres del cliente. */
  nombres: string;
  /** Apellidos del cliente. */
  apellidos: string;
  /** Fecha de nacimiento (`AAAA-MM-DD`). */
  fechaNacimiento: string;
  /** Género: M, F u O; `null` si no se informa. */
  genero: string | null;
  /** Teléfono; `null` si no se informa. */
  telefono: string | null;
  /** Dirección; `null` si no se informa. */
  direccion: string | null;
}
