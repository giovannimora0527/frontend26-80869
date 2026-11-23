import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { getJwtPayload } from 'src/app/utils/jwt.util';
import { environment } from 'src/environments/environment';
import {
  FormulaMedicaService,
  MedicamentoParaFormula
} from './service/formula-medica.service';

interface LineaFormula {
  medicamento: { id: number; nombre: string };
  cantidadPrescrita: number | null;
  viaAdministracion: string | null;
  dosis: string;
  frecuencia: string | null;
  duracionTratamiento: string | null;
  indicaciones: string | null;
}

interface FormulaConDetalle {
  id: number;
  detalles?: LineaFormula[];
}

@Component({
  selector: 'app-detalle-medicamentos',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="border rounded p-3 mb-3">
      <h3 class="h5">Medicamentos de la fórmula {{ formula.id }}</h3>

      @for (linea of formula.detalles ?? []; track $index) {
        <div class="border-bottom py-2">
          <strong>{{ $index + 1 }}. {{ linea.medicamento.nombre }}</strong>
          <div>
            Cantidad: {{ linea.cantidadPrescrita ?? 'Sin registrar' }} ·
            Vía: {{ linea.viaAdministracion || 'Sin registrar' }}
          </div>
          <div>
            Dosis: {{ linea.dosis }} ·
            Frecuencia: {{ linea.frecuencia || 'Sin registrar' }} ·
            Duración: {{ linea.duracionTratamiento || 'Sin registrar' }}
          </div>
          @if (linea.indicaciones) {
            <div>Indicaciones: {{ linea.indicaciones }}</div>
          }
        </div>
      } @empty {
        <p class="text-secondary">Esta fórmula todavía no tiene líneas de detalle.</p>
      }

      @if (esMedico && !abierto) {
        <button type="button" class="btn btn-outline-success mt-3"
                (click)="abrir()">Agregar medicamento</button>
      }

      @if (abierto) {
        <form class="row g-2 mt-2" #form="ngForm" (ngSubmit)="guardar()">
          <div class="col-12">
            <label for="linea-med" class="form-label">Medicamento</label>
            <select id="linea-med" name="medicamento" class="form-select"
                    required [(ngModel)]="datos.medicamentoId">
              <option [ngValue]="null" disabled>Selecciona un medicamento</option>
              @for (p of catalogo; track p.id) {
                <option [ngValue]="p.id" [disabled]="p.cantidadDisponible <= 0">
                  {{ p.nombre }} · {{ p.cantidadDisponible }} disponibles
                </option>
              }
            </select>
          </div>

          <div class="col-md-6">
            <label for="linea-cantidad">Cantidad prescrita</label>
            <input id="linea-cantidad" name="cantidad" class="form-control"
                   type="number" min="1" max="4294967295" step="1" required
                   [(ngModel)]="datos.cantidadPrescrita" />
          </div>
          <div class="col-md-6">
            <label for="linea-via">Vía de administración</label>
            <input id="linea-via" name="via" class="form-control"
                   maxlength="100" required [(ngModel)]="datos.viaAdministracion" />
          </div>
          <div class="col-md-6">
            <label for="linea-dosis">Dosis</label>
            <input id="linea-dosis" name="dosis" class="form-control"
                   maxlength="5000" required [(ngModel)]="datos.dosis" />
          </div>
          <div class="col-md-6">
            <label for="linea-frecuencia">Frecuencia</label>
            <input id="linea-frecuencia" name="frecuencia" class="form-control"
                   maxlength="100" required [(ngModel)]="datos.frecuencia" />
          </div>
          <div class="col-md-6">
            <label for="linea-duracion">Duración</label>
            <input id="linea-duracion" name="duracion" class="form-control"
                   maxlength="100" required [(ngModel)]="datos.duracionTratamiento" />
          </div>
          <div class="col-md-6">
            <label for="linea-indicaciones">Indicaciones</label>
            <input id="linea-indicaciones" name="indicaciones" class="form-control"
                   maxlength="5000" [(ngModel)]="datos.indicaciones" />
          </div>

          <div class="col-12 d-flex gap-2">
            <button type="submit" class="btn btn-success"
                    [disabled]="guardando || form.invalid">
              {{ guardando ? 'Guardando…' : 'Guardar medicamento' }}
            </button>
            <button type="button" class="btn btn-outline-secondary"
                    [disabled]="guardando" (click)="cerrar()">Cancelar</button>
          </div>
        </form>
      }

      @if (mensaje) {
        <p class="mt-2 mb-0" role="status">{{ mensaje }}</p>
      }
    </section>
  `
})
export class DetalleMedicamentosComponent {
  @Input({ required: true }) formula!: FormulaConDetalle;
  @Output() actualizada = new EventEmitter<FormulaConDetalle>();

  abierto = false;
  guardando = false;
  mensaje = '';
  catalogo: MedicamentoParaFormula[] = [];
  datos = this.datosVacios();

  constructor(
    private readonly servicio: FormulaMedicaService,
    private readonly backend: BackendService
  ) {}

  get esMedico(): boolean {
    const rol = getJwtPayload()?.rol?.trim().toLowerCase();
    return rol === 'medico' || rol === 'médico';
  }

  abrir(): void {
    this.abierto = true;
    this.mensaje = '';
    this.datos = this.datosVacios();
    this.catalogo = [];

    this.servicio.listarInventarioParaFormula().subscribe({
      next: productos => {
        this.catalogo = productos.filter(p => p.tipoProducto === 'MEDICAMENTO');
      },
      error: () => {
        this.mensaje = 'No se pudo cargar el inventario. Cierra el formulario y vuelve a abrirlo.';
      }
    });
  }

  cerrar(): void {
    this.abierto = false;
    this.mensaje = '';
  }

  guardar(): void {
    const cantidad = this.datos.cantidadPrescrita;
    if (this.guardando || !this.datos.medicamentoId) return;

    if (cantidad === null || !Number.isInteger(cantidad)
        || cantidad < 1 || cantidad > 4294967295) {
      this.mensaje = 'Escribe una cantidad entera válida.';
      return;
    }

    this.guardando = true;
    this.mensaje = '';

    this.backend.post<FormulaConDetalle>(
      environment.apiUrlAuth,
      'formula-medica',
      this.formula.id + '/medicamentos',
      { ...this.datos }
    )
      .pipe(finalize(() => this.guardando = false))
      .subscribe({
        next: formula => {
          this.actualizada.emit(formula);
          this.abierto = false;
          this.mensaje = 'Medicamento agregado a la fórmula ' + formula.id + '.';
        },
        error: fallo => {
          this.mensaje = fallo.error?.message || 'No se pudo agregar el medicamento.';
        }
      });
  }

  private datosVacios() {
    return {
      medicamentoId: null as number | null,
      cantidadPrescrita: null as number | null,
      viaAdministracion: '',
      dosis: '',
      frecuencia: '',
      duracionTratamiento: '',
      indicaciones: ''
    };
  }
}