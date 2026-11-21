import { Cita } from "./cita";
import { Medicamento } from "./medicamento";

export class Formula {
	id?: number;
	cita!: Cita;
	medicamento!: Medicamento;
	dosis!: string;
	indicaciones?: string | null;
	fechaCreacionRegistro?: Date | string;
	fechaActualizacionRegistro?: Date | string | null;
	fecha_actualizacion_registro?: Date | null;
	frecuencia!: string;
	duracion!: string;
	citaId?: number;
	medicamentoId?: number;
}