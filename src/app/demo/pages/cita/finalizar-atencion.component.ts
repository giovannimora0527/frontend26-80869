import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Cita } from 'src/app/models/cita';
import { BackendService } from 'src/app/services/backend.service';
import { getJwtPayload } from 'src/app/utils/jwt.util';
import { environment } from 'src/environments/environment';

import { FormulaParaPdf, FormulaPdfComponent } from '../formula-medica/formula-pdf.component';
import { PrefacturaCitaComponent } from '../formula-medica/prefactura-cita.component';
import { Medicamento } from 'src/app/models/medicamento';
import { MedicamentoService } from '../medicamento/service/medicamento.service';

interface ServicioDisponible {
  vigenciaId: number;
  nombre: string;
  valor: number;
}

interface Antecedente {
  id: number;
  fecha: string | null;
  descripcion: string;
  diagnostico: string | null;
  observaciones: string | null;
}

@Component({
  selector: 'app-finalizar-atencion',
  standalone: true,
  imports: [FormsModule, FormulaPdfComponent, PrefacturaCitaComponent],
  template: `
    @if (puedeAtender) {
      <section class="border-bottom pb-3 mb-3" aria-labelledby="titulo-atencion">
        <h2 id="titulo-atencion" class="h5">Atención médica</h2>

        <button type="button" class="btn btn-outline-primary mb-3"
                [disabled]="cargandoHistoria" (click)="consultarHistoria()">
          {{ cargandoHistoria ? 'Cargando historia…' : 'Consultar historia clínica' }}
        </button>

        @if (errorHistoria) {
          <p role="alert">{{ errorHistoria }}</p>
        }
        @if (antecedentes; as notas) {
          <section aria-label="Antecedentes clínicos" class="mb-3">
            @for (nota of notas; track nota.id) {
              <article class="border rounded p-2 mb-2">
                <p class="mb-1">{{ nota.fecha }}</p>
                <p class="mb-1">{{ nota.descripcion }}</p>
                <p class="mb-1">{{ nota.diagnostico }}</p>
                <p class="mb-0" style="white-space: pre-line">{{ nota.observaciones }}</p>
              </article>
            } @empty {
              <p role="status">La mascota aún no tiene anotaciones clínicas.</p>
            }
          </section>
        }

        <form (ngSubmit)="guardar()" #formulario="ngForm">
          <fieldset [disabled]="guardando">
            <div class="mb-2">
              <label for="at-sintomas" class="form-label">Síntomas</label>
              <textarea id="at-sintomas" name="sintomas" rows="2"
                        class="form-control" required [(ngModel)]="datos.sintomas"></textarea>
            </div>

            <div class="mb-2">
              <label for="at-diagnostico" class="form-label">Diagnóstico</label>
              <textarea id="at-diagnostico" name="diagnostico" rows="2"
                        class="form-control" required [(ngModel)]="datos.diagnostico"></textarea>
            </div>

            <div class="mb-2">
              <label for="at-observaciones" class="form-label">Observaciones</label>
              <textarea id="at-observaciones" name="observaciones" rows="2"
                        class="form-control" required [(ngModel)]="datos.observaciones"></textarea>
            </div>

            <div class="mb-3">
              <label for="at-recomendaciones" class="form-label">Recomendaciones</label>
              <textarea id="at-recomendaciones" name="recomendaciones" rows="2"
                        class="form-control" required [(ngModel)]="datos.recomendaciones"></textarea>
            </div>

            <h3 class="h6">Servicios de la atención</h3>
            <p>Consulta general incluida según la tarifa vigente.</p>
            <button type="button" class="btn btn-outline-primary mb-2"
                    [disabled]="cargandoServicios" (click)="cargarServicios()">
              Consultar servicios adicionales
            </button>
            @if (errorServicios) {
              <p role="alert">{{ errorServicios }}</p>
            }
            @if (servicios; as opciones) {
              @for (servicio of opciones; track servicio.vigenciaId) {
                <label class="d-block mb-1">
                  <input type="checkbox" [name]="'servicio-' + servicio.vigenciaId"
                         [(ngModel)]="serviciosElegidos[servicio.vigenciaId]">
                  {{ servicio.nombre }} · {{ moneda.format(servicio.valor) }}
                </label>
              } @empty {
                <p>Agrega una tarifa vigente desde Tarifas de servicios para poder seleccionarla.</p>
              }
            }

            <div class="form-check mb-3">
              <input class="form-check-input" type="checkbox" id="at-formular" name="formular"
                     [(ngModel)]="formular" (change)="cargarMedicamentos()">
              <label class="form-check-label" for="at-formular">Generar fórmula médica</label>
            </div>

            @if (formular) {
              <label class="form-label" for="at-medicamento">Medicamento</label>
              <select class="form-select mb-2" id="at-medicamento" name="medicamento"
                      [(ngModel)]="receta.medicamentoId" required>
                <option [ngValue]="null">Selecciona un medicamento</option>
                @for (medicamento of medicamentos; track medicamento.id) {
                  <option [ngValue]="medicamento.id">{{ medicamento.nombre }}</option>
                }
              </select>
              <label class="form-label" for="at-cantidad">Cantidad prescrita</label>
              <input class="form-control mb-2" type="number" id="at-cantidad" name="cantidad"
                     min="1" step="1" [(ngModel)]="receta.cantidadPrescrita" required>
              <label class="form-label" for="at-dosis">Dosis</label>
              <input class="form-control mb-2" id="at-dosis" name="dosis"
                     [(ngModel)]="receta.dosis" required>
              <label class="form-label" for="at-frecuencia">Frecuencia</label>
              <input class="form-control mb-2" id="at-frecuencia" name="frecuencia"
                     [(ngModel)]="receta.frecuencia" required>
              <label class="form-label" for="at-duracionTratamiento">Duración del tratamiento</label>
              <input class="form-control mb-2" id="at-duracionTratamiento" name="duracionTratamiento"
                     [(ngModel)]="receta.duracionTratamiento" required>
              <label class="form-label" for="at-viaAdministracion">Vía de administración</label>
              <input class="form-control mb-2" id="at-viaAdministracion" name="viaAdministracion"
                     [(ngModel)]="receta.viaAdministracion" required>
              <label class="form-label" for="at-indicaciones">Indicaciones</label>
              <input class="form-control mb-2" id="at-indicaciones" name="indicaciones"
                     [(ngModel)]="receta.indicaciones">
            }

            @if (error) {
              <p class="text-danger" role="alert">{{ error }}</p>
            }

            <button type="submit" class="btn btn-success"
                    [disabled]="guardando || formulario.invalid">
              {{ guardando ? 'Guardando…' : 'Finalizar atención' }}
            </button>
          </fieldset>
        </form>
      </section>
    }
    @if (citaAtendidaId; as id) {
      <div class="d-flex gap-2 flex-wrap mb-3">
        @if (formulaGuardada; as formula) {
          <app-formula-pdf [formula]="formula"></app-formula-pdf>
        }
        <app-prefactura-cita [citaId]="id"></app-prefactura-cita>
      </div>
    }
  `
})
export class FinalizarAtencionComponent {
  @Output() finalizada = new EventEmitter<Cita>();

  private actual?: Cita;
  guardando = false;
  error = '';
  datos = this.datosVacios();
  antecedentes: Antecedente[] | null = null;
  cargandoHistoria = false;
  errorHistoria = '';
  private solicitudHistoria = 0;

  servicios: ServicioDisponible[] | null = null;
  serviciosElegidos: Record<number, boolean> = {};
  cargandoServicios = false;
  errorServicios = '';
  private solicitudServicios = 0;
  readonly moneda = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' });

  cargarServicios(): void {
    const id = this.actual?.id;
    if (!id || this.cargandoServicios) return;

    const solicitud = ++this.solicitudServicios;
    this.cargandoServicios = true;
    this.errorServicios = '';
    this.backend.get<ServicioDisponible[]>(environment.apiUrlAuth, 'cita', `${id}/servicios`)
      .pipe(finalize(() => {
        if (solicitud === this.solicitudServicios) this.cargandoServicios = false;
      }))
      .subscribe({
        next: servicios => {
          if (solicitud === this.solicitudServicios) this.servicios = servicios;
        },
        error: () => {
          if (solicitud === this.solicitudServicios) this.errorServicios = 'No se pudieron cargar los servicios.';
        }
      });
  }

  formular = false;
  receta = this.recetaVacia();
  medicamentos: Medicamento[] = [];
  formulaGuardada: FormulaParaPdf | null = null;

  constructor(
    private readonly backend: BackendService,
    private readonly inventario: MedicamentoService
  ) {}

  get citaAtendidaId(): number | undefined {
    const rol = getJwtPayload()?.rol.trim().toLowerCase();
    return (rol === 'medico' || rol === 'médico') && this.actual?.estado === 'ATENDIDA'
      ? this.actual.id : undefined;
  }

  cargarMedicamentos(): void {
    if (!this.formular || this.medicamentos.length) return;
    this.error = '';
    this.inventario.listarInventario().subscribe({
      next: productos => {
        this.medicamentos = productos.filter(p => p.tipoProducto === 'MEDICAMENTO' && p.cantidadDisponible > 0);
      },
      error: () => this.error = 'No se pudo cargar el inventario para la fórmula.'
    });
  }

  private recetaVacia() {
    return {
      medicamentoId: null as number | null,
      cantidadPrescrita: null as number | null,
      dosis: '', frecuencia: '', duracionTratamiento: '',
      viaAdministracion: '', indicaciones: ''
    };
  }

  @Input()
  set cita(valor: Cita) {
    if (valor.id !== this.actual?.id) {
      this.datos = this.datosVacios();
      this.solicitudServicios++;
      this.servicios = null;
      this.serviciosElegidos = {};
      this.cargandoServicios = false;
      this.errorServicios = '';
      this.formular = false;
      this.receta = this.recetaVacia();
      this.formulaGuardada = null;
      this.solicitudHistoria++;
      this.antecedentes = null;
      this.cargandoHistoria = false;
      this.errorHistoria = '';
      this.error = '';
    }
    this.actual = valor;
  }

  get puedeAtender(): boolean {
    const cita = this.actual;
    if (!cita?.id) return false;

    const rol = getJwtPayload()?.rol?.trim().toLowerCase();
    const estado = (cita.estado || '').trim().toUpperCase();

    return (rol === 'medico' || rol === 'médico')
      && ['PROGRAMADA', 'PENDIENTE', 'CONFIRMADA'].includes(estado)
      && new Date(cita.fechaHora).getTime() <= Date.now();
  }

  consultarHistoria(): void {
    const id = this.actual?.id;
    if (!id || this.cargandoHistoria || !this.puedeAtender) return;

    const solicitud = ++this.solicitudHistoria;
    this.cargandoHistoria = true;
    this.errorHistoria = '';

    this.backend.get<Antecedente[]>(environment.apiUrlAuth, 'cita', `${id}/antecedentes`)
      .pipe(finalize(() => {
        if (solicitud === this.solicitudHistoria) this.cargandoHistoria = false;
      }))
      .subscribe({
        next: notas => {
          if (solicitud === this.solicitudHistoria) this.antecedentes = notas;
        },
        error: fallo => {
          if (solicitud === this.solicitudHistoria) {
            this.errorHistoria = fallo.error?.message || 'No se pudo consultar la historia clínica.';
          }
        }
      });
  }

  guardar(): void {
    const cita = this.actual;
    if (!cita?.id || this.guardando || !this.puedeAtender) return;

    if (Object.values(this.datos).some(texto => !texto.trim())) {
      this.error = 'Completa los cuatro campos de la atención.';
      return;
    }

    this.guardando = true;
    this.error = '';

    this.backend.post<FormulaParaPdf | null>(
      environment.apiUrlAuth,
      'cita',
      `${cita.id}/finalizar-atencion`,
      {
        ...this.datos,
        formula: this.formular ? this.receta : null,
        serviciosAdicionales: (this.servicios ?? [])
          .filter(servicio => this.serviciosElegidos[servicio.vigenciaId])
          .map(servicio => servicio.vigenciaId)
      }
    )
      .pipe(finalize(() => this.guardando = false))
      .subscribe({
        next: formula => {
          this.formulaGuardada = formula;
          cita.estado = 'ATENDIDA';
          this.finalizada.emit(cita);
        },
        error: fallo => {
          this.error = fallo.error?.message || 'No se pudo guardar la atención.';
        }
      });
  }

  private datosVacios() {
    return { sintomas: '', diagnostico: '', observaciones: '', recomendaciones: '' };
  }
}