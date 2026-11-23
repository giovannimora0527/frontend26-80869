import { HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

interface FacturaHistorial {
  facturaId: number;
  citaId: number;
  fechaEmision: string;
  propietario: string;
  mascota: string;
  estadoPago: string;
  total: number;
  totalPagado: number;
  saldo: number;
}

@Component({
  selector: 'app-historial-facturacion',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="border-top mt-4 pt-3" aria-labelledby="titulo-historial-facturas">
      <h2 id="titulo-historial-facturas" class="h5">Historial de facturación</h2>

      <form class="d-flex flex-wrap align-items-end gap-2 mb-3" (ngSubmit)="buscar()">
        <div>
          <label for="buscar-historial" class="form-label">
            Nombre o documento del propietario, o nombre de la mascota
          </label>
          <input id="buscar-historial" name="busqueda" type="search"
                 class="form-control" placeholder="Ej. Max"
                 [(ngModel)]="busqueda" [disabled]="cargando" />
        </div>
        <button type="submit" class="btn btn-outline-success"
                [disabled]="cargando || !busqueda.trim()">
          {{ cargando ? 'Buscando…' : 'Buscar historial' }}
        </button>
      </form>

      @if (error) {
        <p class="alert alert-danger" role="alert">{{ error }}</p>
      } @else if (consultado) {
        @if (facturas.length === 0) {
          <p class="text-secondary" role="status">
            No hay facturas que coincidan con «{{ terminoConsultado }}».
          </p>
        } @else {
          <div class="table-responsive">
            <table class="table table-hover align-middle">
              <caption class="caption-top">
                Facturas que coinciden con «{{ terminoConsultado }}»
              </caption>
              <thead>
                <tr>
                  <th scope="col">Factura</th>
                  <th scope="col">Cita</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Propietario</th>
                  <th scope="col">Mascota</th>
                  <th scope="col">Estado</th>
                  <th scope="col" class="text-end">Total</th>
                  <th scope="col" class="text-end">Pagado</th>
                  <th scope="col" class="text-end">Saldo</th>
                </tr>
              </thead>
              <tbody>
                @for (f of facturas; track f.facturaId) {
                  <tr>
                    <th scope="row">{{ f.facturaId }}</th>
                    <td>{{ f.citaId }}</td>
                    <td>{{ f.fechaEmision }}</td>
                    <td>{{ f.propietario }}</td>
                    <td>{{ f.mascota }}</td>
                    <td>{{ f.estadoPago }}</td>
                    <td class="text-end">{{ pesos.format(f.total) }}</td>
                    <td class="text-end">{{ pesos.format(f.totalPagado) }}</td>
                    <td class="text-end">{{ pesos.format(f.saldo) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </section>
  `
})
export class HistorialFacturacionComponent {
  busqueda = '';
  terminoConsultado = '';
  facturas: FacturaHistorial[] = [];
  cargando = false;
  consultado = false;
  error = '';

  readonly pesos = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  constructor(private readonly backend: BackendService) {}

  async buscar(): Promise<void> {
    const termino = this.busqueda.trim();
    if (!termino || this.cargando) return;

    this.cargando = true;
    this.consultado = false;
    this.error = '';
    this.facturas = [];

    try {
      const parametros = new HttpParams().set('busqueda', termino);

      this.facturas = await firstValueFrom(
        this.backend.get<FacturaHistorial[]>(
          environment.apiUrlAuth, 'factura', 'historial', parametros
        )
      );

      this.terminoConsultado = termino;
      this.consultado = true;
    } catch (fallo) {
      this.error = (fallo as { error?: { message?: string } }).error?.message
        || 'No se pudo consultar el historial de facturación.';
    } finally {
      this.cargando = false;
    }
  }
}