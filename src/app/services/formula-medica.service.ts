import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from './backend.service';
import { FormulaFiltro, FormulaMedica, FormulaResumen, FormulaRq } from '../models/formula-medica';
import { Pagina, ParametrosPagina, RespuestaEscritura } from '../models/pagina';
import { construirParams } from '../utils/params.util';
import { environment } from '../../environments/environment';

/** Operaciones de fórmulas médicas contra `/clinica/v1/formula-medica`. */
@Injectable({ providedIn: 'root' })
export class FormulaMedicaService {
  private api = 'formula-medica';

  constructor(private backendService: BackendService) { }

  /** `GET /formula-medica/paginado`: listado resumido paginado. */
  listarPaginado(pagina: ParametrosPagina, filtro: FormulaFiltro): Observable<Pagina<FormulaResumen>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'paginado', construirParams(pagina, filtro));
  }

  /** `GET /formula-medica/consultar/{id}`: detalle completo. */
  consultar(id: number): Observable<FormulaMedica> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `consultar/${id}`);
  }

  /** `POST /formula-medica/guardar`: crea una fórmula. */
  crear(formula: FormulaRq): Observable<RespuestaEscritura> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', formula);
  }

  /** `PUT /formula-medica/actualizar/{id}`: edita dosis, frecuencia, duración e indicaciones. */
  actualizar(id: number, formula: FormulaRq): Observable<RespuestaEscritura> {
    return this.backendService.put(environment.apiUrlAuth, this.api, `actualizar/${id}`, formula);
  }

  /** `PATCH /formula-medica/inactivar/{id}`: inactiva (no se elimina físicamente). */
  inactivar(id: number): Observable<RespuestaEscritura> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `inactivar/${id}`);
  }
}
