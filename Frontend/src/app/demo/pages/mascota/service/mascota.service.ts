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

  /**
   * Lista las mascotas que pertenecen a un cliente especifico. Se usa para los
   * combos dependientes (Cliente -> Mascotas del cliente).
   *
   * @param clienteId identificador del cliente.
   * @returns Observable con las mascotas del cliente.
   */
  listarMascotasPorCliente(clienteId: number): Observable<Mascota[]> {
    const params = new HttpParams().set('clienteId', clienteId);
    return this.backendService.get(environment.apiUrlAuth, this.api, 'buscar-by-cliente', params);
  }

  crearMascota(mascota: Mascota): Observable<unknown> {
    return this.backendService.post(environment.apiUrlAuth, this.api, "guardar", mascota);
  }

  actualizarMascota(mascota: Mascota): Observable<unknown> {
    console.log('Actualizando mascota:', mascota);
    return this.backendService.post(environment.apiUrlAuth, this.api, "actualizar", mascota);
  }

}
