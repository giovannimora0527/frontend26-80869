import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HistoriaMedica } from 'src/app/models/historia-medica';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { FiltroPaginado, Pagina } from 'src/app/models/pagina';
import { HistoriaClinicaRq, HistoriaResumen } from 'src/app/models/resumenes';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/utils/http-utils';
import { environment } from 'src/environments/environment';

/** Consumo de la API de historias clínicas (`/historia-clinica`). */
@Injectable({
  providedIn: 'root'
})
export class HistoriaService {
  private api = `historia-clinica`;

  constructor(private readonly backendService: BackendService) { }

  /** Todas las historias con sus anotaciones (sin paginar). */
  listar(): Observable<HistoriaMedica[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /** Listado paginado con filtros y orden (DataTable). */
  listarPaginado(filtro: FiltroPaginado): Observable<Pagina<HistoriaResumen>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'paginado', construirParams(filtro));
  }

  /** Detalle de una historia con anotaciones y fórmulas. */
  buscarPorId(id: number): Observable<HistoriaMedica> {
    return this.backendService.get(environment.apiUrlAuth, this.api, String(id));
  }

  /** Registra la historia clínica de una consulta (POST). */
  crearHistoria(historia: HistoriaClinicaRq): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', historia);
  }

  /** Edita motivo, diagnóstico y observaciones (PUT). */
  actualizarHistoria(id: number, historia: HistoriaClinicaRq): Observable<MiRespuesta> {
    return this.backendService.put(environment.apiUrlAuth, this.api, String(id), historia);
  }
}
