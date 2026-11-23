import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Component, EventEmitter, Output, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs';
import { environment } from 'src/environments/environment';

interface FilaCsv {
  fila: number;
  datos: Record<string, string>;
  valida: boolean;
  errores: string[];
}

interface VistaPrevia {
  total: number;
  validas: number;
  conErrores: number;
  filas: FilaCsv[];
}

interface Confirmacion {
  importacionId: number;
  total: number;
  importadas: number;
  rechazadas: number;
  yaConfirmada: boolean;
}

@Component({
  selector: 'app-importar-inventario',
  standalone: true,
  template: `
    <button type="button" class="btn btn-outline-success" (click)="abrir(modalCsv)">
      Importar CSV
    </button>

    <ng-template #modalCsv let-modal>
      <div class="modal-header">
        <h2 id="titulo-importar-csv" class="modal-title h5">
          Importar inventario desde CSV
        </h2>
        <button type="button" class="btn-close" aria-label="Cerrar"
                [disabled]="ocupado" (click)="modal.dismiss()"></button>
      </div>

      <div class="modal-body">
        @if (confirmacion; as carga) {
          <div class="alert alert-success mb-0" role="status">
            <h3 class="h6">
              {{ carga.yaConfirmada ? 'Esta carga ya estaba registrada' : 'Importación confirmada' }}
            </h3>
            <p class="mb-1">Archivo: {{ archivo?.name }}</p>
            <p class="mb-1">Número de importación: <strong>{{ carga.importacionId }}</strong></p>
            <p class="mb-0">
              {{ carga.total }} filas · {{ carga.importadas }} importadas ·
              {{ carga.rechazadas }} rechazadas
            </p>
          </div>
        } @else {
          <label for="archivo-csv" class="form-label">Archivo CSV</label>
          <input id="archivo-csv" class="form-control" type="file"
                 accept=".csv,text/csv" [disabled]="ocupado"
                 (change)="seleccionar($event)">
          <small class="text-secondary">
            Usa un CSV en UTF-8 con encabezados y columnas separadas por punto y coma.
          </small>

          <div class="mt-3">
            <button type="button" class="btn btn-outline-success"
                    [disabled]="!archivo || ocupado" (click)="revisar()">
              {{ revisando ? 'Revisando…' : 'Revisar archivo' }}
            </button>
          </div>

          @if (error) {
            <div class="alert alert-danger mt-3" role="alert">{{ error }}</div>
          }

          @if (vista; as resumen) {
            <h3 class="h6 mt-4">Vista previa de {{ archivo?.name }}</h3>
            <p role="status">
              <strong>{{ resumen.total }}</strong> filas ·
              <strong>{{ resumen.validas }}</strong> válidas ·
              <strong>{{ resumen.conErrores }}</strong> con errores
            </p>

            <div class="form-check mb-3">
              <input #filtro id="solo-errores" class="form-check-input" type="checkbox"
                     [checked]="soloErrores" (change)="soloErrores = filtro.checked">
              <label class="form-check-label" for="solo-errores">
                Mostrar solo filas con errores
              </label>
            </div>

            <div class="table-responsive">
              <table class="table table-sm table-hover align-middle">
                <thead>
                  <tr>
                    <th scope="col">Fila</th>
                    <th scope="col">Código</th>
                    <th scope="col">Producto</th>
                    <th scope="col">Lote</th>
                    <th scope="col">Cantidad</th>
                    <th scope="col">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  @for (fila of filasVisibles; track fila.fila) {
                    <tr>
                      <th scope="row">{{ fila.fila }}</th>
                      <td>{{ fila.datos['codigo'] }}</td>
                      <td>{{ fila.datos['nombre'] }}</td>
                      <td>{{ fila.datos['numeroLote'] }}</td>
                      <td>{{ fila.datos['cantidadIngresada'] }}</td>
                      <td>
                        @if (fila.valida) {
                          <span class="badge bg-success">Válida</span>
                        } @else {
                          <span class="text-danger">{{ fila.errores.join(' · ') }}</span>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="6">No hay filas con errores.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary"
                [disabled]="ocupado" (click)="modal.close()">Cerrar</button>

        <button type="button" class="btn btn-success"
                [disabled]="!puedeConfirmar" (click)="confirmar()">
          {{ confirmando ? 'Importando…' : (confirmacion ? 'Carga confirmada' : 'Confirmar importación') }}
        </button>
      </div>
    </ng-template>
  `
})
export class ImportarInventarioComponent {
  @Output() importacionCompletada = new EventEmitter<void>();

  archivo: File | null = null;
  vista: VistaPrevia | null = null;
  confirmacion: Confirmacion | null = null;
  soloErrores = false;
  revisando = false;
  confirmando = false;
  error = '';

  private readonly url = environment.apiUrlAuth + '/medicamento/importacion';

  constructor(
    private readonly http: HttpClient,
    private readonly modales: NgbModal
  ) {}

  get ocupado(): boolean {
    return this.revisando || this.confirmando;
  }

  get puedeConfirmar(): boolean {
    return !!this.archivo && (this.vista?.validas ?? 0) > 0
      && !this.ocupado && this.confirmacion === null;
  }

  get filasVisibles(): FilaCsv[] {
    const filas = this.vista?.filas ?? [];
    return this.soloErrores ? filas.filter(fila => !fila.valida) : filas;
  }

  abrir(plantilla: TemplateRef<unknown>): void {
    this.archivo = null;
    this.limpiarResultado();

    this.modales.open(plantilla, {
      size: 'xl',
      centered: true,
      scrollable: true,
      ariaLabelledBy: 'titulo-importar-csv',
      beforeDismiss: () => !this.ocupado
    });
  }

  seleccionar(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.archivo = input.files?.[0] ?? null;
    this.limpiarResultado();
  }

  revisar(): void {
    if (!this.archivo || this.ocupado) return;
    this.limpiarResultado();

    if (!this.archivo.name.toLowerCase().endsWith('.csv')) {
      this.error = 'Selecciona un archivo con extensión .csv.';
      return;
    }

    this.revisando = true;
    this.enviar<VistaPrevia>('vista-previa', this.archivo)
      .pipe(finalize(() => this.revisando = false))
      .subscribe({
        next: resultado => this.vista = resultado,
        error: (respuesta: HttpErrorResponse) => {
          this.error = respuesta.error?.message || 'No se pudo revisar el archivo.';
        }
      });
  }

  confirmar(): void {
    if (!this.archivo || !this.puedeConfirmar) return;

    this.error = '';
    this.confirmando = true;

    this.enviar<Confirmacion>('confirmar', this.archivo)
      .pipe(finalize(() => this.confirmando = false))
      .subscribe({
        next: resultado => {
          this.confirmacion = resultado;
          this.importacionCompletada.emit();
        },
        error: (respuesta: HttpErrorResponse) => {
          if (respuesta.status === 401) {
            this.error = 'Tu sesión expiró. Vuelve a iniciar sesión.';
          } else if (respuesta.status === 403) {
            this.error = 'Necesitas una cuenta con perfil Administrador para confirmar.';
          } else if (respuesta.status === 0) {
            this.error = 'Se perdió la conexión. Puedes reintentar con el mismo archivo y usuario.';
          } else {
            this.error = respuesta.error?.message || 'No se pudo confirmar la importación.';
          }
        }
      });
  }

  private enviar<T>(operacion: string, archivo: File) {
    const cuerpo = new FormData();
    cuerpo.append('archivo', archivo);

    const token = sessionStorage.getItem('token');
    const headers = token
      ? new HttpHeaders().set('Authorization', 'Bearer ' + token)
      : new HttpHeaders();

    return this.http.post<T>(this.url + '/' + operacion, cuerpo, { headers });
  }

  private limpiarResultado(): void {
    this.vista = null;
    this.confirmacion = null;
    this.soloErrores = false;
    this.error = '';
  }
}