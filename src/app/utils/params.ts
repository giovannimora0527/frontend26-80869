import { HttpParams } from '@angular/common/http';

/**
 * Convierte un objeto de filtros en {@link HttpParams}, omitiendo los valores
 * nulos, indefinidos o vacíos.
 *
 * @param filtro Objeto con los filtros (page, size, sortBy, estado, ...).
 * @returns Parámetros de consulta listos para enviar al backend.
 */
export function construirParams(filtro: object): HttpParams {
  let params = new HttpParams();
  Object.entries(filtro).forEach(([clave, valor]) => {
    if (valor !== null && valor !== undefined && valor !== '') {
      params = params.set(clave, String(valor));
    }
  });
  return params;
}
