import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from './backend.service';
import { HistoriaClinica, HistoriaFiltro, HistoriaResumen, HistoriaRq } from '../models/historia-clinica';
import { Pagina, ParametrosPagina, RespuestaEscritura } from '../models/pagina';
import { construirParams } from '../utils/params.util';
import { environment } from '../../environments/environment';

/** Operaciones de historias clínicas contra `/clinica/v1/historia-medica`. */
@Injectable({ providedIn: 'root' })
export class HistoriaClinicaService {
  private api = 'historia-medica';

  constructor(private backendService: BackendService) { }

  /** `GET /historia-medica/paginado`: listado resumido paginado. */
  listarPaginado(pagina: ParametrosPagina, filtro: HistoriaFiltro): Observable<Pagina<HistoriaResumen>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'paginado', construirParams(pagina, filtro));
  }

  /** `GET /historia-medica/listar`: todas las historias completas. */
  listarHistorias(): Observable<HistoriaClinica[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /** `GET /historia-medica/consultar/{id}`: detalle completo. */
  consultar(id: number): Observable<HistoriaClinica> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `consultar/${id}`);
  }

  /** `POST /historia-medica/guardar`: crea la historia desde una cita atendida. */
  crear(historia: HistoriaRq): Observable<RespuestaEscritura> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', historia);
  }

  /** `PATCH /historia-medica/cerrar/{id}`: cierra la historia (queda de solo lectura). */
  cerrar(id: number): Observable<RespuestaEscritura> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `cerrar/${id}`);
  }
}
