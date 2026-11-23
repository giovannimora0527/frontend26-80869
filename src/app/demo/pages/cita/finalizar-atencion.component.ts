import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Cita } from 'src/app/models/cita';
import { BackendService } from 'src/app/services/backend.service';
import { getJwtPayload } from 'src/app/utils/jwt.util';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-finalizar-atencion',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (puedeAtender) {
      <section class="border-bottom pb-3 mb-3" aria-labelledby="titulo-atencion">
        <h2 id="titulo-atencion" class="h5">Atención médica</h2>

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
  `
})
export class FinalizarAtencionComponent {
  @Output() finalizada = new EventEmitter<Cita>();

  private actual?: Cita;
  guardando = false;
  error = '';
  datos = this.datosVacios();

  constructor(private readonly backend: BackendService) {}

  @Input()
  set cita(valor: Cita) {
    if (valor.id !== this.actual?.id) {
      this.datos = this.datosVacios();
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

  guardar(): void {
    const cita = this.actual;
    if (!cita?.id || this.guardando || !this.puedeAtender) return;

    if (Object.values(this.datos).some(texto => !texto.trim())) {
      this.error = 'Completa los cuatro campos de la atención.';
      return;
    }

    this.guardando = true;
    this.error = '';

    this.backend.post<void>(
      environment.apiUrlAuth,
      'cita',
      `${cita.id}/finalizar-atencion`,
      { ...this.datos }
    )
      .pipe(finalize(() => this.guardando = false))
      .subscribe({
        next: () => {
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