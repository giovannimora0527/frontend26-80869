import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

interface SolicitudPago {
  monto: number;
  medioPago: string;
  referencia: string;
  claveOperacion: string;
}

interface ResultadoPago {
  pagoId: number;
  facturaId: number;
  monto: number;
  totalPagado: number;
  saldo: number;
  estadoPago: string;
}

@Component({
  selector: 'app-pago-factura',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="border-top pt-3 mt-3">
      @if (resultado; as pago) {
        <div class="alert alert-success" role="status">
          <strong>Pago #{{ pago.pagoId }} registrado.</strong>
          <div>Valor del pago: {{ pesos(pago.monto) }}</div>
          <div>Total pagado: {{ pesos(pago.totalPagado) }}</div>
          <div>Saldo pendiente: {{ pesos(pago.saldo) }}</div>
        </div>
      }

      @if (error) {
        <p class="alert alert-danger" role="alert">{{ error }}</p>
      }

      @if (pendiente) {
        <p class="mb-2">
          Pago por comprobar: {{ pesos(pendiente.monto) }} · {{ pendiente.medioPago }}
        </p>
        <button type="button" class="btn btn-outline-primary"
                [disabled]="ocupado" (click)="enviar(pendiente)">
          {{ ocupado ? 'Procesando…' : 'Comprobar el pago' }}
        </button>
      } @else if (estadoPago === 'PENDIENTE_DE_PAGO' || estadoPago === 'PAGO_PARCIAL') {
        @if (!abierto) {
          <button type="button" class="btn btn-outline-success" (click)="abierto = true">
            Registrar pago
          </button>
        } @else {
          <h3 class="h6">Registrar pago de la factura {{ facturaId }}</h3>

          <form class="row g-2 align-items-end" (ngSubmit)="registrar()">
            <div class="col-sm-3">
              <label [for]="'monto-' + facturaId" class="form-label">Valor en COP</label>
              <input [id]="'monto-' + facturaId" name="monto" type="number"
                     class="form-control" min="0.01" step="0.01" required
                     [(ngModel)]="monto" />
            </div>

            <div class="col-sm-3">
              <label [for]="'medio-' + facturaId" class="form-label">Medio de pago</label>
              <select [id]="'medio-' + facturaId" name="medio" class="form-select"
                      required [(ngModel)]="medioPago">
                <option value="">Selecciona un medio</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="TARJETA">Tarjeta</option>
              </select>
            </div>

            <div class="col-sm-3">
              <label [for]="'referencia-' + facturaId" class="form-label">
                Referencia (opcional)
              </label>
              <input [id]="'referencia-' + facturaId" name="referencia" type="text"
                     class="form-control" maxlength="100" [(ngModel)]="referencia" />
            </div>

            <div class="col-auto d-flex gap-2">
              <button type="submit" class="btn btn-success" [disabled]="ocupado">
                Confirmar pago
              </button>
              <button type="button" class="btn btn-outline-secondary"
                      (click)="abierto = false; error = ''">
                Cerrar
              </button>
            </div>
          </form>
        }
      }
    </section>
  `
})
export class PagoFacturaComponent implements OnInit {
  @Input({ required: true }) facturaId!: number;
  @Input({ required: true }) estadoPago!: string;
  @Output() registrado = new EventEmitter<ResultadoPago>();

  abierto = false;
  ocupado = false;
  monto: number | null = null;
  medioPago = '';
  referencia = '';
  error = '';
  pendiente: SolicitudPago | null = null;
  resultado: ResultadoPago | null = null;

  private readonly moneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  constructor(private readonly backend: BackendService) {}

  private get claveLocal(): string {
    return 'clinica.factura.pagoPendiente.' + this.facturaId;
  }

  ngOnInit(): void {
    const guardado = sessionStorage.getItem(this.claveLocal);
    if (guardado) {
      try {
        this.pendiente = JSON.parse(guardado) as SolicitudPago;
      } catch {
        this.error = 'No se pudo leer el pago pendiente. Verifica el registro antes de repetirlo.';
        this.ocupado = true;
      }
    }
  }

  pesos(valor: number): string {
    return this.moneda.format(valor);
  }

  registrar(): void {
    if (this.ocupado || this.pendiente) return;

    const monto = this.monto;
    if (monto === null || !Number.isFinite(monto) || monto <= 0
        || Number(monto.toFixed(2)) !== monto || !this.medioPago) {
      this.error = 'Indica un valor positivo con máximo dos decimales y elige el medio de pago.';
      return;
    }

    const solicitud: SolicitudPago = {
      monto,
      medioPago: this.medioPago,
      referencia: this.referencia.trim(),
      claveOperacion: crypto.randomUUID()
    };

    sessionStorage.setItem(this.claveLocal, JSON.stringify(solicitud));
    this.pendiente = solicitud;
    this.resultado = null;
    void this.enviar(solicitud);
  }

  async enviar(solicitud: SolicitudPago): Promise<void> {
    if (this.ocupado) return;
    this.ocupado = true;
    this.error = '';

    try {
      const pago = await firstValueFrom(
        this.backend.post<ResultadoPago>(
          environment.apiUrlAuth, 'factura', this.facturaId + '/pagos', solicitud
        )
      );

      sessionStorage.removeItem(this.claveLocal);
      this.pendiente = null;
      this.resultado = pago;
      this.abierto = false;
      this.monto = null;
      this.medioPago = '';
      this.referencia = '';
      this.registrado.emit(pago);
    } catch (fallo) {
      const respuesta = fallo as { status?: number; error?: { message?: string } };

      if (respuesta.status === 400 || respuesta.status === 404 || respuesta.status === 409) {
        sessionStorage.removeItem(this.claveLocal);
        this.pendiente = null;
        this.abierto = true;
        this.error = respuesta.error?.message || 'El servidor rechazó el pago.';
      } else if (respuesta.status === 401 || respuesta.status === 403) {
        this.error = 'Ingresa con la cuenta administradora que inició el pago y pulsa Comprobar el pago.';
      } else {
        this.error = 'No se pudo confirmar la respuesta. Pulsa Comprobar el pago para revisar la misma operación.';
      }
    } finally {
      this.ocupado = false;
    }
  }
}