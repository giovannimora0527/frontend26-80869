import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cita, CitaFiltro, CitaRq } from 'src/app/models/cita';
import { PageResponse } from 'src/app/models/page-response';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/utils/params';
import { environment } from 'src/environments/environment';

/**
 * Consumo de la API REST de citas (/cita).
 */
@Injectable({
  providedIn: 'root'
})
export class CitaService {
  /** Recurso base del backend. */
  private readonly api = 'cita';

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
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar', construirParams(filtro));
  }

  /**
   * @returns Estados disponibles para los combos.
   */
  estados(): Observable<string[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'estados');
  }

  /**
   * @param id Id de la cita.
   * @returns Detalle de la cita.
   */
  consultar(id: number): Observable<Cita> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}`);
  }

  /**
   * @param rq Datos de la nueva cita.
   * @returns Cita creada.
   */
  crear(rq: CitaRq): Observable<Cita> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', rq);
  }

  /**
   * @param id Id de la cita.
   * @param rq Nuevos datos (fecha, hora, veterinario y motivo).
   * @returns Cita actualizada.
   */
  actualizar(id: number, rq: CitaRq): Observable<Cita> {
    return this.backendService.put(environment.apiUrlAuth, this.api, `actualizar/${id}`, rq);
  }

  /**
   * @param id Id de la cita.
   * @param estado Nuevo estado.
   * @returns Cita con el estado actualizado.
   */
  cambiarEstado(id: number, estado: string): Observable<Cita> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/estado`, { estado });
  }

  /**
   * Operación explícita para reactivar una cita cancelada.
   *
   * @param id Id de la cita.
   * @returns Cita reactivada (queda PENDIENTE).
   */
  reactivar(id: number): Observable<Cita> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/reactivar`);
  }
}
