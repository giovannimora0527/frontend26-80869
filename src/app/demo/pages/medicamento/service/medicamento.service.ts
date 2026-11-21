import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medicamento } from 'src/app/models/medicamento';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {

  private api = `medicamento`;

  constructor(private backendService: BackendService) {

  }

  listarMedicamentos(): Observable<Medicamento[]> {
    return this.backendService.get(environment.apiUrlAuth, this.api, "listar");
  }
}
