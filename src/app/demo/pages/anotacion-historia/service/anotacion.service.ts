import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Anotacion, AnotacionFiltro, AnotacionRq } from 'src/app/models/anotacion';
import { PageResponse } from 'src/app/models/page-response';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/utils/params';
import { environment } from 'src/environments/environment';

/**
 * Consumo de la API REST de anotaciones (/anotacion-historia).
 */
@Injectable({
  providedIn: 'root'
})
export class AnotacionService {
  /** Recurso base del backend. */
  private readonly api = 'anotacion-historia';

  /**
   * @param backendService Servicio genérico de peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) {}

  /**
   * @param filtro Debe incluir historiaId o mascotaId, más paginación y filtros.
   * @returns Página del histórico de anotaciones (más reciente primero).
   */
  listar(filtro: AnotacionFiltro): Observable<PageResponse<Anotacion>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar', construirParams(filtro));
  }

  /**
   * @param id Id de la anotación.
   * @returns Detalle de la anotación.
   */
  consultar(id: number): Observable<Anotacion> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}`);
  }

  /**
   * @param rq Datos de la anotación.
   * @returns Anotación creada.
   */
  crear(rq: AnotacionRq): Observable<Anotacion> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', rq);
  }
}
