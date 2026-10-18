import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { AnotacionFiltro, AnotacionResumen } from 'src/app/models/anotacion-historia';
import { Medico } from 'src/app/models/medico';
import { Pagina, ParametrosPagina } from 'src/app/models/pagina';
import { AnotacionHistoriaService } from 'src/app/services/anotacion-historia.service';
import { MedicoService } from 'src/app/services/medico.service';
import { PaginadorComponent } from 'src/app/shared/paginador/paginador.component';
import { OrdenThComponent } from 'src/app/shared/orden-th/orden-th.component';
import { TablaServidor } from 'src/app/utils/tabla-servidor';
import { alertaExito } from 'src/app/utils/alertas.util';
import { mensajeDeError } from 'src/app/utils/error.util';
import { formatearFechaHora } from 'src/app/utils/fecha.util';

/**
 * Histórico de **anotaciones** de una historia clínica (se muestra dentro del modal "Ver" de la historia).
 *
 * - DataTable con paginación, filtros (texto, veterinario, fechas) y orden en el servidor.
 * - Formulario reactivo para agregar una anotación mientras la historia esté **Abierta**.
 * - Las anotaciones son inmutables: no existe editar ni eliminar (decisión del historial clínico).
 */
@Component({
  selector: 'app-anotaciones-historia',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PaginadorComponent, OrdenThComponent],
  templateUrl: './anotaciones-historia.component.html'
})
export class AnotacionesHistoriaComponent
  extends TablaServidor<AnotacionResumen, AnotacionFiltro> implements OnInit, OnChanges, OnDestroy {

  /** Historia a la que pertenecen las anotaciones. */
  @Input() historiaId!: number;
  /** `true` si la historia admite nuevas anotaciones. */
  @Input() abierta = false;
  /** Veterinario sugerido para firmar la anotación (el de la historia). */
  @Input() medicoSugeridoId: number | null = null;
  /** Se emite tras guardar una anotación. */
  @Output() anotacionCreada = new EventEmitter<void>();

  filtro: AnotacionFiltro = this.filtroVacio();
  medicos: Medico[] = [];
  form!: FormGroup;
  enviando = false;
  errorFormulario = '';
  mostrarFormulario = false;
  readonly formatear = formatearFechaHora;

  constructor(
    private readonly anotacionService: AnotacionHistoriaService,
    private readonly medicoService: MedicoService,
    private readonly fb: FormBuilder
  ) {
    super({ sortBy: 'fecha', sortDir: 'desc' });
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      medicoId: [this.medicoSugeridoId, Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(3)]],
      observacion: ['', [Validators.required, Validators.minLength(3)]],
      diagnostico: ['', [Validators.required, Validators.minLength(3)]]
    });
    this.medicoService.listarMedicos().subscribe({
      next: (m) => (this.medicos = m),
      error: (e) => (this.errorFormulario = mensajeDeError(e, 'No se pudieron cargar los veterinarios.'))
    });
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['historiaId'] && this.historiaId) {
      this.filtro = this.filtroVacio();
      this.buscar();
    }
  }

  ngOnDestroy(): void {
    this.destruir();
  }

  protected consultar(pagina: ParametrosPagina): Observable<Pagina<AnotacionResumen>> {
    return this.anotacionService.listarPaginado(pagina, { ...this.filtro, historiaId: this.historiaId });
  }

  private filtroVacio(): AnotacionFiltro {
    return { texto: '', medicoId: null, fechaDesde: '', fechaHasta: '' };
  }

  limpiarFiltros(): void {
    this.limpiar(this.filtroVacio());
  }

  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /** Muestra u oculta el formulario de nueva anotación. */
  alternarFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.errorFormulario = '';
    if (this.mostrarFormulario) {
      this.form.reset({ medicoId: this.medicoSugeridoId, descripcion: '', observacion: '', diagnostico: '' });
    }
  }

  /** Guarda la anotación; ante un rechazo del backend deja el mensaje visible sin perder lo escrito. */
  guardar(): void {
    if (this.enviando) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.enviando = true;
    this.errorFormulario = '';
    this.anotacionService.crear({
      historiaId: this.historiaId,
      medicoId: Number(v.medicoId),
      descripcion: String(v.descripcion).trim(),
      observacion: String(v.observacion).trim(),
      diagnostico: String(v.diagnostico).trim()
    }).subscribe({
      next: (r) => {
        this.enviando = false;
        this.mostrarFormulario = false;
        alertaExito(r.message || 'Anotación agregada correctamente.');
        this.buscar();
        this.anotacionCreada.emit();
      },
      error: (e) => {
        this.enviando = false;
        this.errorFormulario = mensajeDeError(e, 'No se pudo guardar la anotación.');
      }
    });
  }

  nombreCompleto(m: Medico): string {
    return `${m.nombres} ${m.apellidos}`.trim();
  }
}
