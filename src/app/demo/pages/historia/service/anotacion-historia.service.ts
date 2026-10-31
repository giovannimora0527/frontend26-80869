import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AnotacionHistoria } from 'src/app/models/anotacion-historia';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { FiltroPaginado, Pagina } from 'src/app/models/pagina';
import { AnotacionRq } from 'src/app/models/resumenes';
import { BackendService } from 'src/app/services/backend.service';
import { construirParams } from 'src/app/utils/http-utils';
import { environment } from 'src/environments/environment';

/** Consumo de la API de anotaciones (`/anotacion-historia`). */
@Injectable({
  providedIn: 'root'
})
export class AnotacionHistoriaService {
  private api = `anotacion-historia`;

  constructor(private readonly backendService: BackendService) { }

  /** Agrega una anotación a una historia existente (POST). */
  crearAnotacion(anotacion: AnotacionRq): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', anotacion);
  }

  /** Histórico paginado de una historia (más reciente primero por defecto). */
  listarPorHistoria(historiaId: number, filtro: FiltroPaginado): Observable<Pagina<AnotacionHistoria>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `por-historia/${historiaId}`, construirParams(filtro));
  }

  /** Histórico paginado de todas las anotaciones de una mascota. */
  listarPorMascota(mascotaId: number, filtro: FiltroPaginado): Observable<Pagina<AnotacionHistoria>> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `por-mascota/${mascotaId}`, construirParams(filtro));
  }

  /** Detalle de una anotación con las fórmulas de su consulta. */
  buscarPorId(id: number): Observable<AnotacionHistoria> {
    return this.backendService.get(environment.apiUrlAuth, this.api, String(id));
  }
}
