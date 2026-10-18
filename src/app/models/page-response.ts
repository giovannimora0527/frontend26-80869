/**
 * Respuesta paginada que entrega el backend en todos los listados (DataTable).
 * Corresponde a `PageRs<T>` del backend.
 */
export interface PageResponse<T> {
  /** Elementos de la página actual. */
  content: T[];
  /** Número de página (base 0). */
  page: number;
  /** Tamaño de página. */
  size: number;
  /** Total de registros que cumplen el filtro. */
  totalElements: number;
  /** Total de páginas. */
  totalPages: number;
  /** Indica si es la primera página. */
  first: boolean;
  /** Indica si es la última página. */
  last: boolean;
}

/**
 * Parámetros comunes de paginación y ordenamiento que se envían al backend
 * (corresponde a `PaginacionRq`).
 */
export interface FiltroPagina {
  /** Página solicitada (base 0). */
  page?: number;
  /** Registros por página (el backend limita a 100). */
  size?: number;
  /** Alias de la columna por la que se ordena (cada módulo del backend define los suyos). */
  sortBy?: string;
  /** Dirección del orden. */
  sortDir?: 'asc' | 'desc';
}
