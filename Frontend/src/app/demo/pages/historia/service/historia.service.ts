import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Historia, HistoriaRequest } from 'src/app/models/historia';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio encargado de consumir los endpoints de historias clinicas del
 * backend.
 */
@Injectable({
  providedIn: 'root'
})
export class HistoriaService {

  /** Nombre base del endpoint de historias clinicas. */
  private api = 'historia-medica';

  constructor(private readonly backendService: BackendService) {}

  /**
   * Lista todas las historias clinicas ordenadas por fecha descendente.
   *
   * @returns Observable con el listado de historias.
   */
  listarHistorias(): Observable<Historia[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar-todas');
  }

  /**
   * Obtiene una historia clinica por su identificador.
   *
   * @param id identificador de la historia.
   * @returns Observable con el detalle de la historia.
   */
  obtenerHistoria(id: number): Observable<Historia> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `obtener/${id}`);
  }

  /**
   * Crea una nueva historia clinica.
   *
   * @param historia datos de la historia.
   * @returns Observable con la historia creada.
   */
  crearHistoria(historia: HistoriaRequest): Observable<Historia> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', historia);
  }
}
