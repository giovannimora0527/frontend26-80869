import { Especializacion } from "./especializacion";

export class Medico {
    id!: number;
    tipoDocumento!: string;
    numeroDocumento!: string;
    nombres!: string;
    apellidos!: string;
    telefono!: string;
    registroProfesional!: string;
    especializacionId?: number;
    especializacion?: Especializacion;
    estado?: boolean;
}