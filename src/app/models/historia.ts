import { Cita } from './cita';
import { Medico } from './medico';
import { Mascota } from './mascota';

/** Historia clínica = una consulta realizada a una mascota. */
export class Historia {
    id!: number;
    fechaCreacion!: Date | string;
    mascota!: Mascota;
    cita?: Cita | null;
    medico?: Medico | null;
    fechaConsulta?: Date | string | null;
    motivo?: string | null;
    diagnostico?: string | null;
    observaciones?: string | null;
}
