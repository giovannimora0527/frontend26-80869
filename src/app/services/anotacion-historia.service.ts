import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from './backend.service';
import { AnotacionFiltro, AnotacionResumen, AnotacionRq } from '../models/anotacion-historia';
import { Pagina, ParametrosPagina, RespuestaEscritura } from '../models/pagina';
import { construirParams } from '../utils/params.util';
import { environment } from '../../environments/environment';

/** Operaciones de anotaciones contra `/clinica/v1/anotacion-historia`. */
@Injectable({ providedIn: 'root' })
export class AnotacionHistoriaService {
  private api = 'anotacion-historia';

  constructor(private backendService: BackendService) { }

  /** `GET /anotacion-historia/paginado`: histórico paginado (más recientes primero). */
  listarPaginado(pagina: ParametrosPagina, filtro: AnotacionFiltro): Observable<Pagina<AnotacionResumen>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'paginado', construirParams(pagina, filtro));
  }

  /** `POST /anotacion-historia/guardar`: agrega una anotación (inmutable una vez guardada). */
  crear(anotacion: AnotacionRq): Observable<RespuestaEscritura> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', anotacion);
  }
}
