import { Cliente } from "./cliente";
import { Raza } from "./raza";

export class Mascota {
    nombreMascota?: string;
    edad?: number;
    fechaRegistro?: Date;
    cliente?: Cliente;
    raza?: Raza;
}