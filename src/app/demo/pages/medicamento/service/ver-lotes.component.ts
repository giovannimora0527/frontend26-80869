import { CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, catchError, map, of, startWith } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

interface LoteResumen {
  id: number;
  numeroLote: string;
  fechaIngreso: string;
  fechaCompra: string;
  fechaVence: string | null;
  precioCompra: number;
  cantidadIngresada: number;
  cantidadDisponible: number;
}

interface ConsultaLotes {
  estado: 'cargando' | 'listo' | 'error';
  lotes: LoteResumen[];
}

@Component({
  selector: 'app-ver-lotes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-template #detalle let-modal>
      <div class="modal-header">
        <div>
          <h2 id="titulo-ver-lotes" class="modal-title h5 mb-1">Lotes del producto</h2>
          <p class="text-secondary mb-0">{{ nombreProducto }}</p>
        </div>
        <button type="button" class="btn-close" aria-label="Cerrar"
                (click)="modal.dismiss()"></button>
      </div>

      <div class="modal-body">
        @if (consulta$ | async; as consulta) {
          @if (consulta.estado === 'cargando') {
            <p class="text-secondary mb-0" role="status">Consultando lotes…</p>
          } @else if (consulta.estado === 'error') {
            <div class="alert alert-danger mb-0" role="alert">
              <p class="mb-2">No se pudieron consultar los lotes de este producto.</p>
              <button type="button" class="btn btn-sm btn-outline-danger"
                      (click)="cargar()">Reintentar</button>
            </div>
          } @else if (consulta.lotes.length === 0) {
            <p class="text-secondary mb-0">Este producto todavía no tiene lotes registrados.</p>
          } @else {
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th scope="col">Lote</th>
                    <th scope="col">Compra</th>
                    <th scope="col">Ingreso</th>
                    <th scope="col">Vencimiento</th>
                    <th scope="col" class="text-end">Compra por unidad</th>
                    <th scope="col" class="text-end">Ingresadas</th>
                    <th scope="col" class="text-end">Disponibles en lote</th>
                  </tr>
                </thead>
                <tbody>
                  @for (lote of consulta.lotes; track lote.id) {
                    <tr>
                      <th scope="row" class="text-nowrap">{{ lote.numeroLote }}</th>
                      <td>{{ lote.fechaCompra | date:'dd/MM/yyyy' }}</td>
                      <td>{{ lote.fechaIngreso | date:'dd/MM/yyyy' }}</td>
                      <td>{{ (lote.fechaVence | date:'dd/MM/yyyy') || 'Sin vencimiento' }}</td>
                      <td class="text-end text-nowrap">
                        {{ lote.precioCompra | currency:'COP':'code':'1.0-2' }}
                      </td>
                      <td class="text-end">{{ lote.cantidadIngresada }}</td>
                      <td class="text-end">{{ lote.cantidadDisponible }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary"
                (click)="modal.close()">Cerrar</button>
      </div>
    </ng-template>
  `
})
export class VerLotesComponent {
  @ViewChild('detalle', { static: true }) detalle!: TemplateRef<unknown>;

  nombreProducto = '';
  consulta$?: Observable<ConsultaLotes>;
  private productoId = 0;

  constructor(
    private readonly backend: BackendService,
    private readonly modalService: NgbModal
  ) {}

  abrir(id: number, nombre: string): void {
    this.productoId = id;
    this.nombreProducto = nombre;
    this.cargar();

    this.modalService.open(this.detalle, {
      size: 'xl',
      centered: true,
      scrollable: true,
      ariaLabelledBy: 'titulo-ver-lotes'
    });
  }

  cargar(): void {
    const cargando: ConsultaLotes = { estado: 'cargando', lotes: [] };

    this.consulta$ = this.backend.get<LoteResumen[]>(
      environment.apiUrlAuth,
      'medicamento',
      `${this.productoId}/lotes`
    ).pipe(
      map((lotes): ConsultaLotes => ({ estado: 'listo', lotes })),
      startWith(cargando),
      catchError(() => of<ConsultaLotes>({ estado: 'error', lotes: [] }))
    );
  }
}