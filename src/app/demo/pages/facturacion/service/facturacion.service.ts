import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

export interface FacturaItemRq {
  tipo: 'SERVICIO' | 'MEDICAMENTO';
  referenciaId: number;
  cantidad: number;
}

export interface FacturaItem {
  id: number;
  tipo: string;
  referenciaId: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  ivaPorcentaje: number;
  subtotal: number;
}

export interface Factura {
  id: number;
  citaId: number;
  fecha: string;
  clienteNombre: string;
  mascotaNombre: string;
  medicoNombre: string;
  subtotal: number;
  iva: number;
  descuento: number;
  total: number;
  estadoPago: string;
  totalPagado: number;
  saldoPendiente: number;
  observacion: string;
  items: FacturaItem[];
}

export interface FacturaRq {
  citaId: number | null;
  descuento?: number;
  observacion?: string;
  items: FacturaItemRq[];
}

export interface MiRespuestaRs {
  status: number;
  message: string;
}

/**
 * Servicio del modulo de facturacion.
 * Consume el modulo /factura del backend.
 */
@Injectable({
  providedIn: 'root'
})
export class FacturacionService {
  private api = 'factura';

  constructor(
    private backendService: BackendService,
    private http: HttpClient
  ) {}

  listar(): Observable<Factura[]> {
    return this.backendService.get<Factura[]>(environment.apiUrlAuth, this.api, 'listar');
  }

  obtener(id: number): Observable<Factura> {
    return this.backendService.get<Factura>(environment.apiUrlAuth, this.api, `obtener?id=${id}`);
  }

  generar(data: FacturaRq): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(environment.apiUrlAuth, this.api, 'generar', data);
  }

  registrarPago(facturaId: number, monto: number, metodo: string): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(
      environment.apiUrlAuth, this.api, 'registrar-pago', { facturaId, monto, metodo });
  }

  anular(id: number): Observable<MiRespuestaRs> {
    return this.backendService.post<MiRespuestaRs>(
      environment.apiUrlAuth, this.api, `anular?id=${id}`, {});
  }

  descargarPdf(id: number): Observable<Blob> {
    const params = new HttpParams().set('id', String(id));
    return this.http.get(`${environment.apiUrlAuth}/${this.api}/pdf`, { params, responseType: 'blob' });
  }
}
