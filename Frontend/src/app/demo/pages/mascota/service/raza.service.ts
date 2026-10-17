import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Raza } from 'src/app/models/raza';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RazaService {

  private api = `raza`;

  constructor(private backendService: BackendService) {

  }

  listarRazas(): Observable<Raza[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
  }

}
