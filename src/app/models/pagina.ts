/** Respuesta paginada del backend (`GET .../paginado`). */
export interface Pagina<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Parámetros de paginación y ordenamiento que viajan en la query string. */
export interface ParametrosPagina {
  page: number;
  size: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

/** Respuesta de las operaciones de escritura: `{ status, message, id }`. */
export interface RespuestaEscritura {
  status: number;
  message: string;
  id?: number;
}

/** Error uniforme del backend: `{ status, error, message }`. */
export interface ErrorBackend {
  status: number;
  error?: string;
  message?: string;
}
