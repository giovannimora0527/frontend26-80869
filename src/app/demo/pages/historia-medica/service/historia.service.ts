import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Historia, HistoriaFiltro, HistoriaRq } from 'src/app/models/historia';
import { PageResponse } from 'src/app/models/page-response';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/utils/params';
import { environment } from 'src/environments/environment';

/**
 * Consumo de la API REST de historias clínicas (/historia-clinica).
 */
@Injectable({
  providedIn: 'root'
})
export class HistoriaService {
  /** Recurso base del backend. */
  private readonly api = 'historia-clinica';

  /**
   * @param backendService Servicio genérico de peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) {}

  /**
   * @param filtro Paginación, orden y filtros.
   * @returns Página de historias clínicas.
   */
  listar(filtro: HistoriaFiltro): Observable<PageResponse<Historia>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar', construirParams(filtro));
  }

  /**
   * @param id Id de la historia.
   * @returns Detalle de la historia.
   */
  consultar(id: number): Observable<Historia> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}`);
  }

  /**
   * @param rq Datos de la historia (a partir de una cita atendida).
   * @returns Historia creada.
   */
  crear(rq: HistoriaRq): Observable<Historia> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', rq);
  }

  /**
   * @param id Id de la historia.
   * @returns Historia cerrada.
   */
  cerrar(id: number): Observable<Historia> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/cerrar`);
  }
}
