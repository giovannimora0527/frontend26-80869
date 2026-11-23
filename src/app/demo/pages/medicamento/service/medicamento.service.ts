import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Medicamento } from 'src/app/models/medicamento';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface InventarioResumen {
  tipoProducto: 'MEDICAMENTO' | 'UTENSILIO';
  id: number;
  nombre: string;
  presentacion: string | null;
  cantidadDisponible: number;
  proximoVencimiento: string | null;
  stockMinimo: number;
  precioVenta: number | null;
}

export interface InventarioPreciosRq {
  precioVenta: number;
  stockMinimo: number;
}

export interface MedicamentoLoteRq {
  numeroLote: string;
  fechaCompra: string;
  fechaVence: string | null;
  precioCompra: number;
  cantidadIngresada: number;
}

@Injectable({
  providedIn: 'root'
})
export class MedicamentoService {
  private readonly api = 'medicamento';

  constructor(private readonly backendService: BackendService) {}

  listarMedicamentos(): Observable<Medicamento[]> {
    return this.backendService.get<Medicamento[]>(
      environment.apiUrlAuth,
      this.api,
      'listar'
    );
  }

  listarInventario(): Observable<InventarioResumen[]> {
    return this.backendService.get<InventarioResumen[]>(
      environment.apiUrlAuth,
      this.api,
      'inventario'
    );
  }

  actualizarPrecioYStockMinimo(
    id: number,
    datos: InventarioPreciosRq
  ): Observable<void> {
    return this.backendService.put<void>(
      environment.apiUrlAuth,
      this.api,
      `${id}/precio-stock`,
      datos
    );
  }

  registrarLote(id: number, datos: MedicamentoLoteRq): Observable<void> {
    return this.backendService.post<void>(
      environment.apiUrlAuth,
      this.api,
      `${id}/lotes`,
      datos
    );
  }
}