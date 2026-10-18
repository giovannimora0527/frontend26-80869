import { Cita } from './cita';
import { Medicamento } from './medicamento';

/** Fila resumida del listado de fórmulas (`GET /formula-medica/paginado`). */
export interface FormulaResumen {
  id: number;
  fechaCreacion: string;
  mascotaNombre: string;
  clienteNombre: string;
  medicoNombre: string;
  medicamentoNombre: string;
  dosis: string;
  frecuencia: string;
  activo: boolean;
}

/** Detalle completo de una fórmula médica. */
export interface FormulaMedica {
  id: number;
  cita: Cita;
  mascota: { mascotaId: number; nombreMascota: string };
  medico: { id: number; nombres: string; apellidos: string };
  historia?: { id: number } | null;
  medicamento: Medicamento;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  indicaciones: string;
  fechaEmision: string;
  activo: boolean;
}

/** Cuerpo para crear o editar una fórmula. */
export interface FormulaRq {
  citaId: number;
  medicamentoId: number;
  dosis: string;
  frecuencia: string;
  duracionDias: number;
  indicaciones: string;
}

/** Filtros del listado de fórmulas. */
export interface FormulaFiltro {
  texto?: string;
  activo?: string;
  clienteId?: number | null;
  mascotaId?: number | null;
  medicoId?: number | null;
  medicamentoId?: number | null;
  fechaDesde?: string;
  fechaHasta?: string;
}
