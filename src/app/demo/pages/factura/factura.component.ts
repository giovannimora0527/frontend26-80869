import { HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { ConsultaFacturasComponent } from './consulta-facturas.component';
import { HistorialFacturacionComponent } from './historial-facturacion.component';
import { ReporteIngresosComponent } from './reporte-ingresos.component';
import { ReporteGestionMedicaComponent } from './reporte-gestion-medica.component';

interface CitaFacturable {
  id: number;
  fecha: string;
  mascota: string;
  propietario: string;
}

interface FacturaEmitida {
  facturaId: number;
  citaId: number;
  estadoPago: string;
  numeroLineas: number;
  subtotal: number;
  impuestos: number;
  total: number;
}

@Component({
  selector: 'app-factura',
  standalone: true,
 imports: [
  FormsModule,
  ConsultaFacturasComponent,
  HistorialFacturacionComponent,
  ReporteIngresosComponent,
  ReporteGestionMedicaComponent
],
  template: `
    <section class="card border-0 shadow-sm">
      <header class="card-header bg-success">
        <h1 class="h4 text-white mb-0">Facturación de servicios</h1>
      </header>

      <div class="card-body">
        <form class="d-flex flex-wrap align-items-end gap-2 mb-3"
              (ngSubmit)="buscarCitas()">
          <div>
            <label for="factura-busqueda" class="form-label">
              Documento del dueño o nombre de la mascota
            </label>
            <input id="factura-busqueda" name="busqueda" type="search"
                   class="form-control" maxlength="120" required
                   [(ngModel)]="busqueda" (ngModelChange)="limpiarBusqueda()"
                   [disabled]="ocupado || buscando" />
          </div>
          <button type="submit" class="btn btn-outline-success"
                  [disabled]="ocupado || buscando || !busqueda.trim()">
            {{ buscando ? 'Buscando…' : 'Buscar citas atendidas' }}
          </button>
        </form>

        @if (consultado && citas.length === 0) {
          <p role="status">No se encontraron citas atendidas.</p>
        }

        @if (citas.length > 0) {
          <label for="factura-cita" class="form-label">Cita atendida</label>
          <select id="factura-cita" class="form-select mb-3"
                  [ngModel]="citaId" (ngModelChange)="cambiarCita($event)"
                  [disabled]="ocupado">
            <option [ngValue]="null">Selecciona una cita</option>
            @for (cita of citas; track cita.id) {
              <option [ngValue]="cita.id">
                {{ cita.fecha }} · {{ cita.mascota }} · {{ cita.propietario }} · Cita {{ cita.id }}
              </option>
            }
          </select>
        }

        @if (citaValida) {
          <button type="button" class="btn btn-success" [disabled]="ocupado" (click)="emitir()">
            {{ ocupado ? 'Emitiendo…' : 'Emitir factura definitiva' }}
          </button>
          <app-consulta-facturas
            [citaId]="citaId"
            (pagoActualizado)="actualizarEstadoPago($event)">
          </app-consulta-facturas>
        }

        @if (error) {
          <p class="alert alert-warning" role="alert">{{ error }}</p>
        }

        @if (factura; as f) {
          <section class="border rounded p-3" aria-labelledby="titulo-factura">
            <h2 id="titulo-factura" class="h5">
              Factura {{ f.facturaId }} · Cita {{ f.citaId }}
            </h2>

            <dl class="row mb-0">
              <dt class="col-sm-4">Estado de pago</dt>
              <dd class="col-sm-8">{{ f.estadoPago }}</dd>

              <dt class="col-sm-4">Líneas facturadas</dt>
              <dd class="col-sm-8">{{ f.numeroLineas }}</dd>

              <dt class="col-sm-4">Subtotal</dt>
              <dd class="col-sm-8">{{ pesos(f.subtotal) }}</dd>

              <dt class="col-sm-4">Impuestos</dt>
              <dd class="col-sm-8">{{ pesos(f.impuestos) }}</dd>

              <dt class="col-sm-4">Total de la factura</dt>
              <dd class="col-sm-8 fw-bold">{{ pesos(f.total) }}</dd>
            </dl>
          </section>
        }
                <app-historial-facturacion></app-historial-facturacion>
        <app-reporte-ingresos></app-reporte-ingresos>
        <app-reporte-gestion-medica></app-reporte-gestion-medica>
      </div>
    </section>
  `
})
export class FacturaComponent {
  citaId: number | null = null;
  busqueda = '';
  citas: CitaFacturable[] = [];
  buscando = false;
  consultado = false;
  ocupado = false;
  error = '';
  factura: FacturaEmitida | null = null;

  private readonly moneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  constructor(private readonly backend: BackendService) {}

  get citaValida(): boolean {
    return this.citaId !== null
      && Number.isSafeInteger(this.citaId)
      && this.citaId > 0;
  }

  limpiarBusqueda(): void {
    this.citas = [];
    this.consultado = false;
    this.cambiarCita(null);
  }

  async buscarCitas(): Promise<void> {
    const termino = this.busqueda.trim();
    if (!termino || this.buscando || this.ocupado) return;

    this.limpiarBusqueda();
    this.buscando = true;
    try {
      this.citas = await firstValueFrom(
        this.backend.get<CitaFacturable[]>(
          environment.apiUrlAuth, 'factura', 'citas-atendidas',
          new HttpParams().set('busqueda', termino)
        )
      );
      this.consultado = true;
      if (this.citas.length === 1) this.cambiarCita(this.citas[0].id);
    } catch (fallo) {
      this.error = (fallo as { error?: { message?: string } }).error?.message
        || 'No se pudieron buscar las citas atendidas.';
    } finally {
      this.buscando = false;
    }
  }

  cambiarCita(id: number | null): void {
    this.citaId = id;
    this.factura = null;
    this.error = '';
  }

  pesos(valor: number): string {
    return this.moneda.format(valor);
  }
    actualizarEstadoPago(pago: { facturaId: number; estadoPago: string }): void {
  if (this.factura?.facturaId === pago.facturaId) {
    this.factura = { ...this.factura, estadoPago: pago.estadoPago };
  }
}

  async emitir(): Promise<void> {
    const id = this.citaId;
    if (this.ocupado || !this.citaValida || id === null) return;

    this.ocupado = true;
    this.error = '';

    try {
      this.factura = await firstValueFrom(
        this.backend.post<FacturaEmitida>(
          environment.apiUrlAuth, 'factura', 'cita/' + id + '/emitir', {}
        )
      );
    } catch (fallo) {
      this.error = (fallo as { error?: { message?: string } }).error?.message
        || 'No se pudo comprobar la emisión. Consulta el registro antes de reintentar.';
    } finally {
      this.ocupado = false;
    }
  }
}