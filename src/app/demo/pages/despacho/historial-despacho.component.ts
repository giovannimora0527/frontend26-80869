import { Component, Input, OnChanges } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';
import { SalidasMedicamentoComponent } from './salidas-medicamento.component';

interface CambioEstado {
  id: number;
  fecha: string;
  estadoAnterior: string | null;
  estadoNuevo: string;
  responsable: string;
  motivo: string | null;
}

@Component({
  selector: 'app-historial-despacho',
  standalone: true,
  template: `
    <div class="mb-3">
      <button type="button" class="btn btn-outline-secondary"
              [attr.aria-expanded]="abierto" (click)="alternar()">
        {{ abierto ? 'Ocultar historial de estados' : 'Ver historial de estados' }}
      </button>

      @if (abierto) {
        <section class="border rounded p-3 mt-2">
          <h3 class="h6">Historial de la fórmula {{ formulaId }}</h3>

          @if (cargando) {
            <p class="mb-0" role="status">Consultando historial…</p>
          } @else if (error) {
            <p class="text-danger mb-2" role="alert">{{ error }}</p>
            <button type="button" class="btn btn-outline-secondary btn-sm"
                    (click)="cargar()">Reintentar</button>
          } @else if (cambios.length === 0) {
            <p class="text-secondary mb-0">
              Esta fórmula todavía no tiene cambios de estado registrados.
            </p>
          } @else {
            <div class="table-responsive">
              <table class="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">Fecha y hora</th>
                    <th scope="col">Estado anterior</th>
                    <th scope="col">Estado nuevo</th>
                    <th scope="col">Responsable</th>
                    <th scope="col">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  @for (cambio of cambios; track cambio.id) {
                    <tr>
                      <td>{{ cambio.fecha }}</td>
                      <td>{{ cambio.estadoAnterior || '—' }}</td>
                      <td>{{ cambio.estadoNuevo }}</td>
                      <td>{{ cambio.responsable }}</td>
                      <td>{{ cambio.motivo || '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      }
    </div>
  `
})
export class HistorialDespachoComponent implements OnChanges {
  @Input({ required: true }) formulaId!: number;
  @Input({ required: true }) estado!: string;

  abierto = false;
  cargando = false;
  error = '';
  cambios: CambioEstado[] = [];
  private consultaActual = 0;

  constructor(private readonly backend: BackendService) {}

  ngOnChanges(): void {
    if (this.abierto) void this.cargar();
  }

  alternar(): void {
    this.abierto = !this.abierto;
    if (this.abierto) void this.cargar();
  }

  async cargar(): Promise<void> {
    const consulta = ++this.consultaActual;
    this.cargando = true;
    this.error = '';
    this.cambios = [];

    try {
      const cambios = await firstValueFrom(
        this.backend.get<CambioEstado[]>(
          environment.apiUrlAuth,
          'despacho',
          'formula/' + this.formulaId + '/historial'
        )
      );

      if (consulta === this.consultaActual) this.cambios = cambios;
    } catch (fallo) {
      if (consulta === this.consultaActual) {
        this.error = (fallo as { error?: { message?: string } }).error?.message
          || 'No se pudo cargar el historial.';
      }
    } finally {
      if (consulta === this.consultaActual) this.cargando = false;
    }
  }
}