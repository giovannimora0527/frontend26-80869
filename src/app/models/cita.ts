import { Cliente } from './cliente';
import { Mascota } from './mascota';
import { Medico } from './medico';

/** Estados que acepta el backend para una cita. */
export const ESTADOS_CITA = ['Pendiente', 'Confirmada', 'Programada', 'Atendida', 'Cancelada'] as const;
export type EstadoCita = typeof ESTADOS_CITA[number];

/** Fila resumida del listado de citas (`GET /cita/paginado`). */
export interface CitaResumen {
  id: number;
  fecha: string;
  hora: string;
  fechaHora: string;
  clienteId: number;
  clienteNombre: string;
  mascotaId: number;
  mascotaNombre: string;
  medicoId: number;
  medicoNombre: string;
  estado: string;
  motivo: string;
}

/** Detalle completo de una cita (`GET /cita/consultar/{id}`). */
export interface Cita {
  id: number;
  cliente: Cliente;
  mascota: Mascota;
  medico: Medico;
  fechaHora: string;
  estado: string;
  motivo: string;
}

/** Cuerpo para crear o editar una cita. */
export interface CitaRq {
  clienteId: number;
  mascotaId: number;
  medicoId: number;
  fecha: string;
  hora: string;
  motivo: string;
  estado: string;
}

/** Filtros del listado de citas. */
export interface CitaFiltro {
  texto?: string;
  estado?: string;
  clienteId?: number | null;
  mascotaId?: number | null;
  medicoId?: number | null;
  fechaDesde?: string;
  fechaHasta?: string;
}
