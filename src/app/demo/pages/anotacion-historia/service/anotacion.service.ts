import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Anotacion, AnotacionFiltro, AnotacionRq } from 'src/app/models/anotacion';
import { PageResponse } from 'src/app/models/page-response';
import { MiRespuestaRS } from 'src/app/models/respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/utils/params';
import { environment } from 'src/environments/environment';

/**
 * Consumo de la API REST de anotaciones (`/anotaciones` en el backend).
 *
 * | Método | Ruta                            | Uso                                   |
 * |--------|---------------------------------|---------------------------------------|
 * | POST   | /anotaciones                    | Agregar una anotación a una historia  |
 * | GET    | /anotaciones/historia/{id}      | Histórico paginado de una historia    |
 * | GET    | /anotaciones/{id}               | Detalle de una anotación              |
 */
@Injectable({
  providedIn: 'root'
})
export class AnotacionService {
  /** Recurso base del backend. */
  private readonly api = 'anotaciones';

  /**
   * @param backendService Servicio genérico de peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) {}

  /**
   * @param historiaId Historia de la que se consultan las anotaciones.
   * @param filtro Paginación, orden y filtros.
   * @returns Página del histórico de anotaciones (más reciente primero por defecto).
   */
  listarPorHistoria(historiaId: number, filtro: AnotacionFiltro): Observable<PageResponse<Anotacion>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `historia/${historiaId}`, construirParams(filtro));
  }

  /**
   * @param id Id de la anotación.
   * @returns Detalle de la anotación.
   */
  consultar(id: number): Observable<Anotacion> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}`);
  }

  /**
   * @param rq Datos de la anotación (la historia debe estar ACTIVA).
   * @returns Respuesta del backend con el mensaje y la anotación creada.
   */
  crear(rq: AnotacionRq): Observable<MiRespuestaRS<Anotacion>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, undefined, rq);
  }
}
