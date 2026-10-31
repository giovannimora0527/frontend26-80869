import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cita } from 'src/app/models/cita';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { FiltroPaginado, Pagina } from 'src/app/models/pagina';
import { CitaRq, CitaResumen } from 'src/app/models/resumenes';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/utils/http-utils';
import { environment } from 'src/environments/environment';

/** Consumo de la API de citas (`/cita`). */
@Injectable({
  providedIn: 'root'
})
export class CitaService {

  private api = `cita`;

  constructor(private backendService: BackendService) { }

  /** Lista todas las citas sin paginar (se conserva para otras pantallas). */
  listarCitas(): Observable<Cita[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /** Listado paginado con filtros y orden (DataTable). */
  listarPaginado(filtro: FiltroPaginado): Observable<Pagina<CitaResumen>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'paginado', construirParams(filtro));
  }

  /** Citas de una mascota (más reciente primero). */
  listarCitasPorMascota(mascotaId: number): Observable<Cita[]> {
    const params = new HttpParams().set('mascotaId', mascotaId);
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar-por-mascota', params);
  }

  /** Detalle completo de una cita. */
  buscarPorId(id: number): Observable<Cita> {
    return this.backendService.get(environment.apiUrlAuth, this.api, String(id));
  }

  /** Crea una cita (POST). */
  guardarCita(cita: CitaRq): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', cita);
  }

  /** Edita una cita (PUT). */
  actualizarCita(id: number, cita: CitaRq): Observable<MiRespuesta> {
    return this.backendService.put(environment.apiUrlAuth, this.api, String(id), cita);
  }

  /** Cambia solo el estado (PATCH): confirmar, atender, cancelar... */
  cambiarEstado(id: number, estado: string): Observable<MiRespuesta> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/estado`, { estado });
  }

  /** Operación explícita para reactivar una cita cancelada (PATCH). */
  reactivar(id: number): Observable<MiRespuesta> {
    return this.backendService.patch(environment.apiUrlAuth, this.api, `${id}/reactivar`, {});
  }
}
