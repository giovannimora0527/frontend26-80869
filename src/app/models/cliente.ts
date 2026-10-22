export class Cliente {
   id?: number;
   tipoDocumento?: string;
   numeroDocumento?: string;
   nombres?: string;
   apellidos?: string;
   direccion?: string;
   fechaNacimiento?: Date | string;
   genero?: string;
   telefono?: string;
   activo?: boolean;
   usuarioId?: number;
}