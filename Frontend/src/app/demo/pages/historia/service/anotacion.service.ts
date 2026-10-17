import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Anotacion, AnotacionRequest } from 'src/app/models/anotacion';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio encargado de consumir los endpoints de anotaciones de historia
 * clinica del backend.
 */
@Injectable({
  providedIn: 'root'
})
export class AnotacionService {

  /** Nombre base del endpoint de anotaciones. */
  private api = 'anotacion-historia';

  constructor(private readonly backendService: BackendService) {}

  /**
   * Lista las anotaciones de una historia clinica ordenadas de la mas reciente
   * a la mas antigua.
   *
   * @param historiaId identificador de la historia clinica.
   * @returns Observable con las anotaciones de la historia.
   */
  listarPorHistoria(historiaId: number): Observable<Anotacion[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `listar/${historiaId}`);
  }

  /**
   * Crea una nueva anotacion dentro de una historia clinica.
   *
   * @param anotacion datos de la anotacion.
   * @returns Observable con la respuesta del backend.
   */
  crearAnotacion(anotacion: AnotacionRequest): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', anotacion);
  }
}
