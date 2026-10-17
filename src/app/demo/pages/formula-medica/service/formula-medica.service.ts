import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FormulaDetalle, FormulaFiltro, FormulaResumen, FormulaRq } from 'src/app/models/formula-medica';
import { PageResponse } from 'src/app/models/page-response';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/utils/params';
import { environment } from 'src/environments/environment';

/**
 * Consumo de la API REST de fórmulas médicas (/formula-medica).
 */
@Injectable({
  providedIn: 'root'
})
export class FormulaMedicaService {
  /** Recurso base del backend. */
  private readonly api = 'formula-medica';

  /**
   * @param backendService Servicio genérico de peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) {}

  /**
   * Lista resumida y paginada (por defecto, la más reciente primero).
   *
   * @param filtro Paginación, orden y filtros.
   * @returns Página de fórmulas resumidas.
   */
  listar(filtro: FormulaFiltro): Observable<PageResponse<FormulaResumen>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar', construirParams(filtro));
  }

  /**
   * @param id Id de la fórmula.
   * @returns Detalle completo.
   */
  consultar(id: number): Observable<FormulaDetalle> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}`);
  }

  /**
   * @param rq Datos de la nueva fórmula.
   * @returns Fórmula creada.
   */
  crear(rq: FormulaRq): Observable<FormulaDetalle> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', rq);
  }

  /**
   * @param id Id de la fórmula.
   * @param rq Campos editables.
   * @returns Fórmula actualizada.
   */
  actualizar(id: number, rq: FormulaRq): Observable<FormulaDetalle> {
    return this.backendService.put(environment.apiUrlAuth, this.api, `actualizar/${id}`, rq);
  }

  /**
   * Inactivación lógica (no existe eliminación física).
   *
   * @param id Id de la fórmula.
   * @returns Fórmula inactiva.
   */
  inactivar(id: number): Observable<FormulaDetalle> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/inactivar`);
  }

  /**
   * @param id Id de la fórmula.
   * @returns Fórmula reactivada.
   */
  activar(id: number): Observable<FormulaDetalle> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/activar`);
  }
}
