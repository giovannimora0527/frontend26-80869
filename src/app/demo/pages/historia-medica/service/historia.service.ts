import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HistoriaDetalle, HistoriaFiltro, HistoriaResumen, HistoriaRq } from 'src/app/models/historia';
import { PageResponse } from 'src/app/models/page-response';
import { MiRespuestaRS } from 'src/app/models/respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/utils/params';
import { environment } from 'src/environments/environment';

/**
 * Consumo de la API REST de historias clínicas (`/historias` en el backend).
 *
 * | Método | Ruta                  | Uso                                   |
 * |--------|-----------------------|---------------------------------------|
 * | GET    | /historias            | Listado paginado con filtros y orden  |
 * | GET    | /historias/{id}       | Detalle                               |
 * | POST   | /historias            | Crear a partir de una cita atendida   |
 * | PATCH  | /historias/{id}/cerrar| Cerrar la historia                    |
 */
@Injectable({
  providedIn: 'root'
})
export class HistoriaService {
  /** Recurso base del backend. */
  private readonly api = 'historias';

  /**
   * @param backendService Servicio genérico de peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) {}

  /**
   * @param filtro Paginación, orden y filtros.
   * @returns Página de historias clínicas (resumen).
   */
  listar(filtro: HistoriaFiltro): Observable<PageResponse<HistoriaResumen>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, undefined, construirParams(filtro));
  }

  /**
   * @param id Id de la historia.
   * @returns Detalle de la historia (diagnóstico, observaciones y total de anotaciones).
   */
  consultar(id: number): Observable<HistoriaDetalle> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}`);
  }

  /**
   * @param rq Datos de la historia (a partir de una cita atendida).
   * @returns Respuesta del backend con el mensaje y la historia creada.
   */
  crear(rq: HistoriaRq): Observable<MiRespuestaRS<HistoriaDetalle>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, undefined, rq);
  }

  /**
   * @param id Id de la historia.
   * @returns Respuesta del backend con la historia cerrada.
   */
  cerrar(id: number): Observable<MiRespuestaRS<HistoriaDetalle>> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/cerrar`);
  }
}
