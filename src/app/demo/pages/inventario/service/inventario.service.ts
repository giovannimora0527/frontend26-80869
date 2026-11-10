import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface Lote {
  id?: number;
  numeroLote: string;
  cantidad: number;
  precioCompra: number;
  fechaIngreso?: string;
  fechaVencimiento: string;
  vencido?: boolean;
  proximoAVencer?: boolean;
}

export interface Medicamento {
  id?: number;
  nombre: string;
  codigo?: string;
  descripcion?: string;
  presentacion?: string;
  requiereInvima: boolean;
  registroInvima?: string;
  precioCompra: number;
  precioVenta: number;
  stockMinimo: number;
  fechaProximoPedido?: string;
  fechaCompra?: string;
  fechaVence?: string;
  existenciaTotal?: number;
  agotado?: boolean;
  stockBajo?: boolean;
  tieneProximosAVencer?: boolean;
  tieneVencidos?: boolean;
  lotes?: Lote[];
}

export interface MiRespuestaRs {
  status: number;
  message: string;
}

export interface MovimientoInventario {
  id: number;
  medicamentoId: number;
  medicamentoNombre: string;
  loteId?: number;
  tipo: string;
  cantidad: number;
  fecha: string;
  usuarioResponsable: string;
  referencia: string;
  observacion?: string;
}

export interface AgregarLote {
  medicamentoId: number;
  numeroLote: string;
  cantidad: number;
  precioCompra: number;
  fechaIngreso?: string;
  fechaVencimiento: string;
}

export interface FilaCarga {
  fila: number;
  nombre: string;
  codigo: string;
  presentacion: string;
  requiereInvima: boolean;
  registroInvima: string;
  precioCompra: string;
  precioVenta: string;
  stockMinimo: string;
  numeroLote: string;
  cantidad: string;
  fechaVencimiento: string;
  valida: boolean;
  motivoError: string;
}

export interface CargaMasivaRs {
  totalRegistros: number;
  registrosValidos: number;
  registrosConError: number;
  confirmado: boolean;
  mensaje: string;
  filas: FilaCarga[];
}

/**
 * Servicio del modulo de inventario.
 * Consume los endpoints del modulo /inventario del backend.
 */
@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private api = 'inventario';

  constructor(private backendService: BackendService) {}

  listar(): Observable<Medicamento[]> {
    return this.backendService.get<Medicamento[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  obtener(id: number): Observable<Medicamento> {
    return this.backendService.get<Medicamento>(environment.apiUrlAuth, this.api, `obtener?id=${id}`);
  }

  guardar(data: Medicamento): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(environment.apiUrlAuth, this.api, 'guardar', data);
  }

  actualizar(data: Medicamento): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(environment.apiUrlAuth, this.api, 'actualizar', data);
  }

  movimientos(medicamentoId: number): Observable<MovimientoInventario[]> {
    return this.backendService.get<MovimientoInventario[]>(
      environment.apiUrlAuth,
      this.api,
      `movimientos?medicamentoId=${medicamentoId}`
    );
  }

  agregarLote(data: AgregarLote): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(
      environment.apiUrlAuth,
      this.api,
      'agregar-lote',
      data
    );
  }

  previsualizarCarga(archivo: File): Observable<CargaMasivaRs> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.backendService.postFile<CargaMasivaRs>(
      environment.apiUrlAuth,
      this.api,
      'carga-masiva/previsualizar',
      formData
    );
  }

  confirmarCarga(archivo: File): Observable<CargaMasivaRs> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.backendService.postFile<CargaMasivaRs>(
      environment.apiUrlAuth,
      this.api,
      'carga-masiva/confirmar',
      formData
    );
  }
}
