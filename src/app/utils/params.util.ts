import { HttpParams } from '@angular/common/http';
import { ParametrosPagina } from '../models/pagina';

/**
 * Construye los `HttpParams` de un listado paginado: paginación + ordenamiento + filtros.
 * Los filtros vacíos (`''`, `null`, `undefined`) no se envían, así el backend aplica solo los que el usuario llenó.
 *
 * @param pagina paginación y orden
 * @param filtro filtros del listado (objeto plano)
 */
export function construirParams(pagina: ParametrosPagina, filtro: object): HttpParams {
  let params = new HttpParams().set('page', pagina.page).set('size', pagina.size);
  if (pagina.sortBy) {
    params = params.set('sortBy', pagina.sortBy).set('sortDir', pagina.sortDir ?? 'asc');
  }
  for (const [clave, valor] of Object.entries(filtro)) {
    if (valor !== null && valor !== undefined && String(valor).trim() !== '') {
      params = params.set(clave, String(valor).trim());
    }
  }
  return params;
}
