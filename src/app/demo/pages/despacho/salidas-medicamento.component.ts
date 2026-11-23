import { HttpParams } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

interface SalidaMedicamento {
  detalleId: number;
  entregaId: number;
  formulaId: number;
  medicamento: string;
  lote: string;
  unidadesEntregadas: number;
  fechaEntrega: string;
  responsable: string;
    mascota: string;
  propietario: string;
  medico: string;
  estadoDespacho: string;
}

@Component({
  selector: 'app-salidas-medicamento',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="border-top pt-3 mt-4" aria-labelledby="titulo-salidas">
      <h2 id="titulo-salidas" class="h5">Salidas por medicamento</h2>

      <form class="d-flex flex-wrap align-items-end gap-2 mb-3"
            (ngSubmit)="buscar()">
        <div>
          <label for="medicamento-salidas" class="form-label">
            Nombre del medicamento
          </label>
          <input id="medicamento-salidas"
                 name="medicamento"
                 type="search"
                 class="form-control"
                 placeholder="Ej. Amoxicilina"
                 [(ngModel)]="nombre"
                 [disabled]="cargando"
                 required />
        </div>

        <button type="submit"
                class="btn btn-outline-success"
                [disabled]="cargando || !nombre.trim()">
          {{ cargando ? 'Consultando…' : 'Consultar salidas' }}
        </button>
      </form>

      @if (error) {
        <div class="alert alert-danger" role="alert">{{ error }}</div>
      } @else if (consultado) {
        @if (salidas.length === 0) {
          <p class="text-secondary" role="status">
            No hay entregas registradas para «{{ terminoConsultado }}».
          </p>
        } @else {
          <div class="table-responsive">
            <table class="table table-sm table-hover align-middle">
              <caption class="caption-top">
                Entregas que coinciden con «{{ terminoConsultado }}»
              </caption>
              <thead>
                <tr>
                  <th scope="col">Fecha y hora</th>
                  <th scope="col">Entrega</th>
                  <th scope="col">Fórmula</th>
                  <th scope="col">Medicamento</th>
                  <th scope="col">Lote</th>
                  <th scope="col" class="text-end">Unidades</th>
                                    <th scope="col">Responsable de entrega</th>
                  <th scope="col">Mascota y propietario</th>
                  <th scope="col">Médico veterinario</th>
                  <th scope="col">Estado actual</th>
                </tr>
              </thead>
              <tbody>
                @for (salida of salidas; track salida.detalleId) {
                  <tr>
                    <td>{{ salida.fechaEntrega }}</td>
                    <td>{{ salida.entregaId }}</td>
                    <td>{{ salida.formulaId }}</td>
                    <td>{{ salida.medicamento }}</td>
                    <td>{{ salida.lote }}</td>
                    <td class="text-end">{{ salida.unidadesEntregadas }}</td>
                                        <td>{{ salida.responsable }}</td>
                    <td>
                      <div>{{ salida.mascota }}</div>
                      <small class="text-secondary">{{ salida.propietario }}</small>
                    </td>
                    <td>{{ salida.medico }}</td>
                    <td>{{ salida.estadoDespacho }}</td>
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
export class SalidasMedicamentoComponent {
  nombre = '';
  terminoConsultado = '';
  salidas: SalidaMedicamento[] = [];
  cargando = false;
  consultado = false;
  error = '';

  constructor(private readonly backend: BackendService) {}

  async buscar(): Promise<void> {
    const termino = this.nombre.trim();
    if (!termino || this.cargando) return;

    this.cargando = true;
    this.consultado = false;
    this.error = '';
    this.salidas = [];

    try {
      const params = new HttpParams().set('medicamento', termino);

      this.salidas = await firstValueFrom(
        this.backend.get<SalidaMedicamento[]>(
          environment.apiUrlAuth,
          'despacho',
          'salidas',
          params
        )
      );

      this.terminoConsultado = termino;
      this.consultado = true;
    } catch (fallo) {
      this.error = (fallo as { error?: { message?: string } }).error?.message
        || 'No se pudieron consultar las salidas del medicamento.';
    } finally {
      this.cargando = false;
    }
  }
}