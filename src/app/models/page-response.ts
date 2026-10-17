/**
 * Respuesta paginada que entrega el backend en todos los listados (DataTable).
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
}

/**
 * Parámetros comunes de paginación y ordenamiento que se envían al backend.
 */
export interface FiltroPagina {
  /** Página solicitada (base 0). */
  page?: number;
  /** Registros por página. */
  size?: number;
  /** Alias de la columna por la que se ordena (definido por el backend). */
  sortBy?: string;
  /** Dirección del orden. */
  sortDir?: 'asc' | 'desc';
}
