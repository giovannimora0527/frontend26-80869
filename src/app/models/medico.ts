import { Especializacion } from "./especializacion";

export class Medico {
    id?: number;
    tipo_documento?: string;
    numero_documento?: number;
    nombres?: string;
    apellidos?: string;
    telefono?: number;
    registro_profesional?: string;
    especializacion_id?: Especializacion;
}