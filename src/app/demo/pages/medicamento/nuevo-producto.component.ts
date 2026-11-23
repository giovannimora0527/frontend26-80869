import { Component, EventEmitter, Output, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-nuevo-producto',
  standalone: true,
  imports: [FormsModule],
  template: `
    <button type="button" class="btn btn-success" [disabled]="cargandoDetalle" (click)="abrir(plantilla)">
      Nuevo producto
    </button>

    @if (avisoDetalle) { <div class="alert alert-danger mt-2" role="alert">{{ avisoDetalle }}</div> }
    <ng-template #plantilla let-modal>
      <form #form="ngForm" (ngSubmit)="guardar(form)" novalidate>
        <div class="modal-header">
          <h2 id="titulo-nuevo-producto" class="modal-title h5">{{ idEdicion === null ? "Nuevo producto" : "Editar producto" }}</h2>
          <button type="button" class="btn-close" aria-label="Cerrar"
                  [disabled]="guardando" (click)="modal.dismiss()"></button>
        </div>

        <div class="modal-body">
          <fieldset [disabled]="guardando" class="row g-3">
            <div class="col-12">
              <label for="nuevo-nombre" class="form-label">Nombre *</label>
              <input id="nuevo-nombre" class="form-control" name="nombre"
                     [(ngModel)]="datos.nombre" required maxlength="100">
            </div>

            <div class="col-sm-6">
              <label for="nuevo-codigo" class="form-label">Código *</label>
              <input id="nuevo-codigo" class="form-control" name="codigo"
                     [(ngModel)]="datos.codigo" required maxlength="8"
                     pattern="[A-Za-z0-9]{8}" placeholder="Ej. UTEN0121">
              <small class="text-secondary">8 letras o números.</small>
            </div>

            <div class="col-sm-6">
              <label for="nuevo-tipo" class="form-label">Tipo de producto *</label>
              <select id="nuevo-tipo" class="form-select" name="tipo"
                      [(ngModel)]="datos.tipoProducto" required>
                <option value="MEDICAMENTO">Medicamento</option>
                <option value="UTENSILIO">Utensilio</option>
              </select>
            </div>

            <div class="col-12">
              <label for="nuevo-invima" class="form-label">
                Registro INVIMA {{ datos.tipoProducto === 'MEDICAMENTO' ? '*' : '(opcional)' }}
              </label>
              <input id="nuevo-invima" class="form-control" name="invima"
                     [(ngModel)]="datos.registroInvima" maxlength="100"
                     [required]="datos.tipoProducto === 'MEDICAMENTO'">
            </div>

            <div class="col-12">
              <label for="nueva-presentacion" class="form-label">Presentación</label>
              <input id="nueva-presentacion" class="form-control" name="presentacion"
                     [(ngModel)]="datos.presentacion" maxlength="100"
                     placeholder="Ej. Unidad individual">
            </div>

            <div class="col-sm-6">
              <label for="nuevo-precio" class="form-label">Precio de venta (COP) *</label>
              <input id="nuevo-precio" type="number" class="form-control" name="precio"
                     [(ngModel)]="datos.precioVenta" min="0" max="9999999999.99"
                     step="0.01" pattern="[0-9]+([.][0-9]{1,2})?" required>
            </div>

            <div class="col-sm-6">
              <label for="nuevo-minimo" class="form-label">Stock mínimo *</label>
              <input id="nuevo-minimo" type="number" class="form-control" name="minimo"
                     [(ngModel)]="datos.stockMinimo" min="0" max="2147483647"
                     step="1" pattern="[0-9]+" required>
            </div>

            <div class="col-12">
              <label for="nuevo-pedido" class="form-label">Fecha del próximo pedido</label>
              <input id="nuevo-pedido" type="date" class="form-control" name="pedido"
                     [(ngModel)]="datos.fechaProximoPedido">
            </div>

            <div class="col-12">
              <label for="nueva-descripcion" class="form-label">Descripción</label>
              <textarea id="nueva-descripcion" class="form-control" name="descripcion"
                        rows="2" [(ngModel)]="datos.descripcion"></textarea>
            </div>
          </fieldset>

          @if (error) {
            <div class="alert alert-danger mt-3 mb-0" role="alert">{{ error }}</div>
          }
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary"
                  [disabled]="guardando" (click)="modal.dismiss()">Cancelar</button>
          <button type="submit" class="btn btn-success" [disabled]="guardando">
            {{ guardando ? 'Guardando…' : (idEdicion === null ? 'Guardar producto' : 'Guardar cambios') }}
          </button>
        </div>
      </form>
    </ng-template>
  `
})
export class NuevoProductoComponent {
  @Output() creado = new EventEmitter<string>();
  @Output() actualizado = new EventEmitter<string>();
  @ViewChild('plantilla', { static: true }) plantillaEdicion!: TemplateRef<unknown>;

  idEdicion: number | null = null;
  cargandoDetalle = false;
  avisoDetalle = '';

  datos = this.formularioVacio();
  guardando = false;
  error = '';
  private ventana?: NgbModalRef;

  constructor(
    private readonly modalService: NgbModal,
    private readonly backend: BackendService
  ) {}

  abrir(plantilla: TemplateRef<unknown>): void {
    this.idEdicion = null;
    this.avisoDetalle = '';
    this.datos = this.formularioVacio();
    this.error = '';
    this.mostrarModal(plantilla);
  }

  private mostrarModal(plantilla: TemplateRef<unknown>): void {
    this.ventana = this.modalService.open(plantilla, {
      centered: true,
      scrollable: true,
      ariaLabelledBy: 'titulo-nuevo-producto',
      beforeDismiss: () => !this.guardando
    });
  }

  abrirParaEditar(id: number): void {
    if (this.cargandoDetalle || this.guardando) return;

    this.avisoDetalle = '';
    this.cargandoDetalle = true;
    this.backend.get<{
      codigo: string | null;
      nombre: string;
      tipoProducto: string;
      registroInvima: string | null;
      presentacion: string | null;
      descripcion: string | null;
      precioVenta: number | null;
      stockMinimo: number;
      fechaProximoPedido: string | null;
    }>(environment.apiUrlAuth, 'medicamento', `${id}/detalle`)
      .pipe(finalize(() => this.cargandoDetalle = false))
      .subscribe({
        next: producto => {
          this.idEdicion = id;
          this.error = '';
          this.datos = {
            codigo: producto.codigo ?? '',
            nombre: producto.nombre,
            tipoProducto: producto.tipoProducto,
            registroInvima: producto.registroInvima ?? '',
            presentacion: producto.presentacion ?? '',
            descripcion: producto.descripcion ?? '',
            precioVenta: producto.precioVenta,
            stockMinimo: producto.stockMinimo,
            fechaProximoPedido: producto.fechaProximoPedido ?? ''
          };
          this.mostrarModal(this.plantillaEdicion);
        },
        error: () => {
          this.avisoDetalle = 'No se pudieron cargar los datos del producto. Vuelve a pulsar Editar.';
        }
      });
  }

  guardar(form: NgForm): void {
    if (this.guardando) return;

    this.error = '';
    form.form.markAllAsTouched();

    const nombre = this.datos.nombre.trim();
    const registroInvima = this.datos.registroInvima.trim();

    if (!nombre) {
      this.error = 'Escribe el nombre del producto.';
      return;
    }
    if (!/^[a-zA-Z0-9]{8}$/.test(this.datos.codigo)) {
      this.error = 'El código debe tener exactamente 8 letras o números.';
      return;
    }
    if (this.datos.tipoProducto === 'MEDICAMENTO' && !registroInvima) {
      this.error = 'El registro INVIMA es obligatorio para medicamentos.';
      return;
    }
    if (form.invalid) {
      this.error = 'Revisa el precio de venta y el stock mínimo. El precio admite dos decimales y el stock debe ser entero.';
      return;
    }

    this.guardando = true;
    const datos = {
      ...this.datos,
      nombre,
      codigo: this.datos.codigo.toUpperCase(),
      registroInvima: registroInvima || null,
      fechaProximoPedido: this.datos.fechaProximoPedido || null
    };

    const solicitud = this.idEdicion === null
      ? this.backend.post<{ id: number }>(environment.apiUrlAuth, 'medicamento', 'crear', datos)
      : this.backend.put<{ id: number }>(environment.apiUrlAuth, 'medicamento', `${this.idEdicion}/detalle`, datos);

    solicitud.pipe(finalize(() => this.guardando = false))
      .subscribe({
        next: () => {
          this.ventana?.close();
          if (this.idEdicion === null) {
            this.creado.emit(nombre);
          } else {
            this.actualizado.emit(nombre);
          }
        },
        error: err => {
          this.error = err.status === 0
            ? 'Se perdió la conexión. Consulta el inventario antes de volver a enviar.'
            : err.error?.message || 'No se pudo guardar el producto.';
        }
      });
  }

  private formularioVacio() {
    return {
      nombre: '',
      codigo: '',
      tipoProducto: 'MEDICAMENTO',
      registroInvima: '',
      presentacion: '',
      descripcion: '',
      precioVenta: null as number | null,
      stockMinimo: 0 as number | null,
      fechaProximoPedido: ''
    };
  }
}