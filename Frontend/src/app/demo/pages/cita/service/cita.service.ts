import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Cita, CitaRequest } from 'src/app/models/cita';
import { MiRespuesta } from 'src/app/models/mi-respuesta';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio encargado de consumir los endpoints de citas del backend.
 */
@Injectable({
  providedIn: 'root'
})
export class CitaService {

  /** Nombre base del endpoint de citas. */
  private api = 'cita';

  constructor(private readonly backendService: BackendService) {}

  /**
   * Lista todas las citas ordenadas por fecha y hora de forma descendente.
   *
   * @returns Observable con el listado de citas.
   */
  listarCitas(): Observable<Cita[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Crea una nueva cita.
   *
   * @param cita datos de la cita a crear.
   * @returns Observable con la respuesta del backend.
   */
  crearCita(cita: CitaRequest): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'crear', cita);
  }

  /**
   * Actualiza una cita existente.
   *
   * @param cita datos de la cita a actualizar.
   * @returns Observable con la respuesta del backend.
   */
  actualizarCita(cita: CitaRequest): Observable<MiRespuesta> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'actualizar', cita);
  }
}
