import { FiltroPagina } from './page-response';

/** Estados posibles de una cita (siempre en mayúsculas, igual que el backend). */
export type EstadoCita = 'PENDIENTE' | 'PROGRAMADA' | 'CONFIRMADA' | 'ATENDIDA' | 'CANCELADA';

/**
 * Transiciones de estado permitidas. Solo sirve para mostrar u ocultar botones:
 * el backend es quien valida de verdad.
 */
export const TRANSICIONES_CITA: Record<EstadoCita, EstadoCita[]> = {
  PENDIENTE: ['CONFIRMADA', 'PROGRAMADA', 'CANCELADA'],
  PROGRAMADA: ['CONFIRMADA', 'ATENDIDA', 'CANCELADA'],
  CONFIRMADA: ['ATENDIDA', 'CANCELADA'],
  ATENDIDA: [],
  CANCELADA: []
};

/** Estados en los que una cita todavía puede editarse. */
export const ESTADOS_EDITABLES: EstadoCita[] = ['PENDIENTE', 'PROGRAMADA', 'CONFIRMADA'];

/**
 * Cita tal como la devuelve el backend (listado y detalle).
 */
export interface Cita {
  /** Identificador de la cita. */
  id: number;
  /** Fecha y hora completas (ISO). */
  fechaHora: string;
  /** Fecha (yyyy-MM-dd). */
  fecha: string;
  /** Hora (HH:mm:ss). */
  hora: string;
  /** Id del cliente. */
  clienteId: number;
  /** Nombre completo del cliente. */
  clienteNombre: string;
  /** Id de la mascota. */
  mascotaId: number;
  /** Nombre de la mascota. */
  mascotaNombre: string;
  /** Id del veterinario. */
  medicoId: number;
  /** Nombre del veterinario. */
  medicoNombre: string;
  /** Estado de la cita. */
  estado: EstadoCita;
  /** Motivo de la consulta. */
  motivo: string;
  /** Id de la historia asociada (solo en el detalle). */
  historiaId?: number | null;
}

/**
 * Datos que se envían para crear o editar una cita.
 */
export interface CitaRq {
  /** Cliente dueño de la mascota. */
  clienteId: number;
  /** Mascota (debe pertenecer al cliente). */
  mascotaId: number;
  /** Veterinario asignado. */
  medicoId: number;
  /** Fecha y hora en formato ISO (yyyy-MM-ddTHH:mm:ss). */
  fechaHora: string;
  /** Motivo de la consulta. */
  motivo: string;
  /** Estado inicial (solo al crear). */
  estado?: string;
}

/**
 * Filtros del listado de citas.
 */
export interface CitaFiltro extends FiltroPagina {
  /** Estado exacto. */
  estado?: string;
  /** Id del cliente. */
  clienteId?: number;
  /** Id de la mascota. */
  mascotaId?: number;
  /** Id del veterinario. */
  medicoId?: number;
  /** Fecha inicial (yyyy-MM-dd). */
  fechaDesde?: string;
  /** Fecha final (yyyy-MM-dd). */
  fechaHasta?: string;
  /** Texto libre: mascota o cliente. */
  texto?: string;
}
