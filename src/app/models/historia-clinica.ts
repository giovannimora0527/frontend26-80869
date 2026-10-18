import { Cita } from './cita';
import { Cliente } from './cliente';
import { Mascota } from './mascota';
import { Medico } from './medico';

/** Estados de una historia clínica. */
export const ESTADOS_HISTORIA = ['Abierta', 'Cerrada'] as const;

/** Fila resumida del listado de historias (`GET /historia-medica/paginado`). */
export interface HistoriaResumen {
  id: number;
  fechaHora: string;
  mascotaId: number;
  mascotaNombre: string;
  clienteId: number;
  clienteNombre: string;
  medicoId: number;
  medicoNombre: string;
  citaId: number;
  motivo: string;
  estado: string;
}

/** Detalle completo de una historia clínica. */
export interface HistoriaClinica {
  id: number;
  cliente: Cliente;
  mascota: Mascota;
  cita: Cita;
  medico: Medico;
  fechaCreacion: string;
  motivo: string;
  diagnostico: string;
  observaciones: string;
  estado: string;
}

/** Cuerpo para crear una historia desde una cita atendida. */
export interface HistoriaRq {
  clienteId: number;
  mascotaId: number;
  citaId: number;
  medicoId: number;
  fechaHora?: string;
  motivo: string;
  diagnostico: string;
  observaciones: string;
}

/** Filtros del listado de historias. */
export interface HistoriaFiltro {
  texto?: string;
  estado?: string;
  clienteId?: number | null;
  mascotaId?: number | null;
  medicoId?: number | null;
  citaId?: number | null;
  fechaDesde?: string;
  fechaHasta?: string;
}
