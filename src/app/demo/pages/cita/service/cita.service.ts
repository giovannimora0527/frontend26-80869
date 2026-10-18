import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cita, CitaFiltro, CitaRq } from 'src/app/models/cita';
import { PageResponse } from 'src/app/models/page-response';
import { MiRespuestaRS } from 'src/app/models/respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/utils/params';
import { environment } from 'src/environments/environment';

/**
 * Consumo de la API REST de citas (`/citas` en el backend).
 *
 * | Método | Ruta                   | Uso                                   |
 * |--------|------------------------|---------------------------------------|
 * | GET    | /citas                 | Listado paginado con filtros y orden  |
 * | GET    | /citas/{id}            | Detalle de una cita                   |
 * | POST   | /citas                 | Crear                                 |
 * | PUT    | /citas/{id}            | Editar o cambiar de estado            |
 * | PATCH  | /citas/{id}/reactivar  | Reactivar una cita cancelada          |
 */
@Injectable({
  providedIn: 'root'
})
export class CitaService {
  /** Recurso base del backend. */
  private readonly api = 'citas';

  /**
   * @param backendService Servicio genérico de peticiones HTTP.
   */
  constructor(private readonly backendService: BackendService) {}

  /**
   * Lista las citas con paginación, filtros y orden en el servidor.
   *
   * @param filtro Paginación, orden y filtros.
   * @returns Página de citas.
   */
  listar(filtro: CitaFiltro): Observable<PageResponse<Cita>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, undefined, construirParams(filtro));
  }

  /**
   * @param id Id de la cita.
   * @returns Detalle de la cita (incluye `historiaId` si ya tiene historia).
   */
  consultar(id: number): Observable<Cita> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}`);
  }

  /**
   * @param rq Datos de la nueva cita.
   * @returns Respuesta del backend con el mensaje y la cita creada.
   */
  crear(rq: CitaRq): Observable<MiRespuestaRS<Cita>> {
    return this.backendService.post(environment.apiUrlAuth, this.api, undefined, rq);
  }

  /**
   * Edita una cita. También sirve para cambiar su estado: se envía el estado destino en
   * `rq.estado` y el backend valida la transición.
   *
   * @param id Id de la cita.
   * @param rq Datos completos de la cita.
   * @returns Respuesta del backend con la cita actualizada.
   */
  actualizar(id: number, rq: CitaRq): Observable<MiRespuestaRS<Cita>> {
    return this.backendService.put(environment.apiUrlAuth, this.api, `${id}`, rq);
  }

  /**
   * Cambia únicamente el estado de una cita reutilizando sus datos actuales.
   *
   * @param cita Cita tal como está en el listado.
   * @param estado Estado destino.
   * @returns Respuesta del backend con la cita actualizada.
   */
  cambiarEstado(cita: Cita, estado: string): Observable<MiRespuestaRS<Cita>> {
    const rq: CitaRq = {
      clienteId: cita.clienteId,
      mascotaId: cita.mascotaId,
      medicoId: cita.medicoId,
      fechaHora: cita.fechaHora,
      motivo: cita.motivo,
      estado
    };
    return this.actualizar(cita.id, rq);
  }

  /**
   * Operación explícita para reactivar una cita cancelada.
   *
   * @param id Id de la cita.
   * @returns Respuesta del backend con la cita reactivada (queda PENDIENTE).
   */
  reactivar(id: number): Observable<MiRespuestaRS<Cita>> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/reactivar`);
  }
}
