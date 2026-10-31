import { Cita } from "./cita";
import { Mascota } from "./mascota";
import { Medicamento } from "./medicamento";
import { Medico } from "./medico";

/** Fórmula médica tal como la devuelve el backend (detalle completo). */
export class Formula {
	id?: number;
	cita!: Cita;
	mascota?: Mascota;
	medico?: Medico;
	medicamento!: Medicamento;
	dosis!: string;
	indicaciones?: string | null;
	fechaEmision?: Date | string;
	fechaCreacionRegistro?: Date | string;
	fechaActualizacionRegistro?: Date | string | null;
	frecuencia!: string;
	duracion!: string;
	/** `false` = fórmula inactiva (nunca se borra físicamente). */
	activo?: boolean;
}
