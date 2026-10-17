
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedicoServiceService {

  private api = 'medico';

  constructor(
    private backendService: BackendService
  ) { }

  listarMedicos(): Observable<any[]> {
    return this.backendService.get<any[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }
}
