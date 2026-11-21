import { Cliente } from "./cliente";
import { Raza } from "./raza";

export class Mascota {
    mascotaId?: number;
    nombreMascota?: string;
    edad?: number;
    fechaRegistro?: Date | string;
    fechaModificacion?: Date | string;
    cliente?: Cliente;
    raza?: Raza;
    razaId?: number;
    clienteId?: number;
    nombre?: string;
    activo?: boolean;
}