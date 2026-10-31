/**
 * Respuesta de los listados paginados del backend.
 * @typeParam T tipo de cada fila.
 */
export interface Pagina<T> {
  /** Filas de la página actual. */
  content: T[];
  /** Página actual (base 0). */
  page: number;
  /** Tamaño de página. */
  size: number;
  /** Total de filas que cumplen los filtros. */
  totalElements: number;
  /** Total de páginas. */
  totalPages: number;
}

/** Parámetros que acepta cualquier listado paginado (todos opcionales). */
export interface FiltroPaginado {
  page?: number;
  size?: number;
  sort?: string;
  dir?: 'asc' | 'desc';
  q?: string;
  estado?: string;
  desde?: string;
  hasta?: string;
  clienteId?: number;
  mascotaId?: number;
  medicoId?: number;
  medicamentoId?: number;
  activo?: boolean;
}
