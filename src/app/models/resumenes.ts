/** Fila resumida de una cita (listado). */
export interface CitaResumen {
  id: number;
  fechaHora: string;
  clienteId?: number;
  clienteNombre?: string;
  mascotaId?: number;
  mascotaNombre?: string;
  medicoId?: number;
  medicoNombre?: string;
  motivo?: string;
  estado: string;
}

/** Datos para crear o editar una cita. */
export interface CitaRq {
  id?: number;
  clienteId?: number;
  mascotaId?: number;
  medicoId?: number;
  fechaHora: string;
  motivo: string;
  estado?: string;
}

/** Fila resumida de una historia clínica (listado). */
export interface HistoriaResumen {
  id: number;
  fechaConsulta: string;
  mascotaId?: number;
  mascotaNombre?: string;
  clienteId?: number;
  clienteNombre?: string;
  medicoId?: number;
  medicoNombre?: string;
  citaId?: number;
  motivo?: string;
  estado?: string;
  totalAnotaciones: number;
}

/** Datos para registrar o editar una historia clínica (una consulta). */
export interface HistoriaClinicaRq {
  id?: number;
  clienteId?: number;
  mascotaId?: number;
  citaId?: number;
  medicoId?: number;
  fechaHora?: string;
  motivo: string;
  diagnostico: string;
  observaciones: string;
}

/** Datos para agregar una anotación a una historia existente. */
export interface AnotacionRq {
  historiaId: number;
  medicoId: number;
  descripcion: string;
  diagnostico: string;
  observaciones: string;
}

/** Fila resumida de una fórmula (listado). */
export interface FormulaResumen {
  id: number;
  fechaEmision: string;
  fechaCreacionRegistro: string;
  mascotaId?: number;
  mascotaNombre?: string;
  clienteNombre?: string;
  medicoId?: number;
  medicoNombre?: string;
  medicamentoNombre?: string;
  activo: boolean;
}

/** Datos para crear o editar una fórmula. */
export interface FormulaRq {
  id?: number;
  mascotaId?: number;
  citaId?: number;
  medicoId?: number;
  medicamentoId?: number;
  dosis: string;
  frecuencia: string;
  duracion: string;
  indicaciones: string;
  fechaEmision?: string;
}
