import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface Menu {
  menuId: number;
  code: string;
  title: string;
  url: string;
  icon: string;
  activo: boolean;
}

export interface Rol {
  perfilId?: number;
  nombre: string;
  activo?: boolean;
  menuIds: number[];
}

export interface MiRespuestaRs {
  status: number;
  message: string;
}

/**
 * Servicio de gestion de roles (perfiles) y sus menus.
 * Consume los endpoints del modulo /rol del backend (solo Administrador).
 */
@Injectable({
  providedIn: 'root'
})
export class RolService {
  private api = 'rol';

  constructor(private backendService: BackendService) {}

  listar(): Observable<Rol[]> {
    return this.backendService.get<Rol[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  listarMenus(): Observable<Menu[]> {
    return this.backendService.get<Menu[]>(environment.apiUrlAuth, this.api, 'menus');
  }

  guardar(data: Rol): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(environment.apiUrlAuth, this.api, 'guardar', data);
  }

  actualizar(data: Rol): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(environment.apiUrlAuth, this.api, 'actualizar', data);
  }
}
