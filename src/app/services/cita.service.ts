import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from './backend.service';
import { Cita, CitaFiltro, CitaResumen, CitaRq } from '../models/cita';
import { Pagina, ParametrosPagina, RespuestaEscritura } from '../models/pagina';
import { construirParams } from '../utils/params.util';
import { environment } from '../../environments/environment';

/** Operaciones de citas contra `/clinica/v1/cita`. */
@Injectable({ providedIn: 'root' })
export class CitaService {
  private api = 'cita';

  constructor(private backendService: BackendService) { }

  /** `GET /cita/paginado`: listado resumido con paginación, filtros y orden en el servidor. */
  listarPaginado(pagina: ParametrosPagina, filtro: CitaFiltro): Observable<Pagina<CitaResumen>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'paginado', construirParams(pagina, filtro));
  }

  /** `GET /cita/listar`: todas las citas completas (para combos que dependen de la cita). */
  listarCitas(): Observable<Cita[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /** `GET /cita/consultar/{id}`: detalle completo. */
  consultar(id: number): Observable<Cita> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `consultar/${id}`);
  }

  /** `POST /cita/guardar`: crea una cita. */
  crear(cita: CitaRq): Observable<RespuestaEscritura> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', cita);
  }

  /** `PUT /cita/actualizar/{id}`: edita fecha, hora, veterinario, motivo y estado. */
  actualizar(id: number, cita: CitaRq): Observable<RespuestaEscritura> {
    return this.backendService.put(environment.apiUrlAuth, this.api, `actualizar/${id}`, cita);
  }

  /** `PATCH /cita/cancelar/{id}`: cancela (no existe borrado físico). */
  cancelar(id: number): Observable<RespuestaEscritura> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `cancelar/${id}`);
  }

  /** `PATCH /cita/reactivar/{id}`: vuelve a activar una cita cancelada (revalida agenda). */
  reactivar(id: number): Observable<RespuestaEscritura> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `reactivar/${id}`);
  }
}
