import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mascota } from 'src/app/models/mascota';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MascotaService {
  private api = `mascota`;

  constructor(private backendService: BackendService) {
    
  }

  listarMascotas(): Observable<Mascota[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
  }

  crearMascota(mascota: Mascota): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, "guardar", mascota);
  }

  actualizarMascota(mascota: Mascota): Observable<unknown> {
    console.log('Actualizando mascota:', mascota);
    return this.backendService.post(environment.apiUrlAuth, this.api, "actualizar", mascota);
  }

  /**
   * Lista únicamente las mascotas que pertenecen a un cliente (combo dependiente).
   *
   * @param clienteId Id del cliente seleccionado.
   * @returns Mascotas del cliente.
   */
  listarPorCliente(clienteId: number): Observable<Mascota[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, 'buscar-by-cliente',
      new HttpParams().set('clienteId', clienteId));
  }

  /**
   * Consulta una mascota por su id.
   *
   * @param id Id de la mascota.
   * @returns Mascota encontrada (404 si no existe).
   */
  consultarMascota(id: number): Observable<Mascota> {
    return this.backendService.get(environment.apiUrlAuth, this.api, `${id}`);
  }
}
