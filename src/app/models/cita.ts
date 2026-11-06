import { Cliente } from './cliente';
import { Mascota } from './mascota';
import { Medico } from './medico';

export class Cita {
	id?: number;
	cliente?: Cliente;
	mascota?: Mascota;
	medico?: Medico;
	fechaHora!: Date | string;
	estado!: string;
	motivo!: string | null;
	mascotaId?: number;
	medicoId?: number;
}