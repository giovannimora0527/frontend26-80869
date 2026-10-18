import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Mascota } from 'src/app/models/mascota';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

/**
 * Servicio para gestionar las operaciones CRUD de mascotas.
 * Se comunica con el backend a través del BackendService.
 */
@Injectable({
  providedIn: 'root'
})
export class MascotaService {
  
  private api = 'mascota';

  constructor(private backendService: BackendService) { }

  /**
   * Lista todas las mascotas ordenadas por fecha de registro descendente.
   * @returns Observable con el array de mascotas
   */
  listarMascotas(): Observable<Mascota[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'listar');
  }

  /**
   * Busca mascotas por nombre.
   * @param nombre Nombre o fragmento del nombre a buscar
   * @returns Observable con las mascotas encontradas
   */
  buscarPorNombre(nombre: string): Observable<Mascota[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `buscar?nombre=${encodeURIComponent(nombre)}`);
  }

  /**
   * Obtiene las mascotas de un cliente específico.
   * @param clienteId ID del cliente
   * @returns Observable con las mascotas del cliente
   */
  buscarPorCliente(clienteId: number): Observable<Mascota[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `buscarPorCliente?clienteId=${clienteId}`);
  }

  /**
   * Crea una nueva mascota en el sistema.
   * @param mascota Datos de la mascota a crear
   * @returns Observable con la respuesta del servidor
   */
  crearMascota(mascota: Mascota): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, 'guardar', mascota);
  }

  /**
   * Actualiza una mascota existente.
   * @param mascota Datos de la mascota a actualizar
   * @returns Observable con la respuesta del servidor
   */
  actualizarMascota(mascota: Mascota): Observable<unknown> {
    return this.backendService.put(environment.apiUrlAuth, this.api, `actualizar/${mascota.mascotaId}`, mascota);
  }
}