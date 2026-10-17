import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Anotacion, AnotacionFiltro } from 'src/app/models/anotacion';
import { PageResponse } from 'src/app/models/page-response';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { ColumnaTabla, DataTableComponent } from 'src/app/shared/data-table/data-table.component';
import { mensajeDeError } from 'src/app/utils/api-error';
import { AnotacionService } from '../../anotacion-historia/service/anotacion.service';

/**
 * Histórico de anotaciones en un DataTable (filtrar, ordenar por fecha, paginar y consultar el
 * detalle de una anotación). Se reutiliza en el modal "Ver" de la historia clínica y en la
 * pantalla de anotaciones. Siempre muestra primero la anotación más reciente.
 */
@Component({
  selector: 'app-anotaciones-tabla',
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  templateUrl: './anotaciones-tabla.component.html'
})
export class AnotacionesTablaComponent implements OnChanges {
  /** Historia de la que se muestran las anotaciones (opcional). */
  @Input() historiaId: number | null = null;
  /** Mascota de la que se muestra todo el histórico (opcional). */
  @Input() mascotaId: number | null = null;
  /** Contador que el padre incrementa para forzar la recarga (p. ej. tras crear una anotación). */
  @Input() refrescar = 0;

  /** Columnas del DataTable. */
  readonly columnas: ColumnaTabla[] = [
    { campo: 'fecha', titulo: 'Fecha y hora', ordenPor: 'fecha', formato: 'fechaHora' },
    { campo: 'medicoNombre', titulo: 'Veterinario', ordenPor: 'medico' },
    { campo: 'descripcion', titulo: 'Descripción', max: 60 },
    { campo: 'diagnosticoEvolucion', titulo: 'Diagnóstico / evolución', max: 60 }
  ];

  /** Si es true se muestra el histórico de toda la mascota en lugar de solo esta historia. */
  verTodaMascota = false;
  /** Página actual de anotaciones. */
  pagina: PageResponse<Anotacion> | null = null;
  /** Indica si hay una consulta en curso. */
  cargando = false;
  /** Paginación, orden (fecha descendente) y filtros vigentes. */
  filtro: AnotacionFiltro = { page: 0, size: 5, sortBy: 'fecha', sortDir: 'desc' };
  /** Formulario de filtros. */
  filtrosForm: FormGroup;
  /** Anotación cuyo detalle se está mostrando. */
  detalle: Anotacion | null = null;

  /**
   * @param anotacionService Servicio de anotaciones.
   * @param notificacion Mensajes al usuario.
   * @param formBuilder Constructor de formularios reactivos.
   */
  constructor(
    private readonly anotacionService: AnotacionService,
    private readonly notificacion: NotificacionService,
    formBuilder: FormBuilder
  ) {
    this.filtrosForm = formBuilder.group({ texto: [''], fechaDesde: [''], fechaHasta: [''] });
  }

  /** Reinicia la consulta cuando cambia la historia, la mascota o el contador de refresco. */
  ngOnChanges(): void {
    this.detalle = null;
    this.filtro = { ...this.filtro, page: 0 };
    this.cargar();
  }

  /** Consulta la página actual del histórico. */
  cargar(): void {
    if (!this.historiaId && !this.mascotaId) {
      this.pagina = null;
      return;
    }
    const porMascota = this.mascotaId && (this.verTodaMascota || !this.historiaId);
    const consulta: AnotacionFiltro = {
      ...this.filtro,
      historiaId: porMascota ? undefined : (this.historiaId ?? undefined),
      mascotaId: porMascota ? (this.mascotaId ?? undefined) : undefined
    };
    this.cargando = true;
    this.anotacionService.listar(consulta).subscribe({
      next: (datos) => {
        this.pagina = datos;
        this.cargando = false;
      },
      error: (error) => {
        this.cargando = false;
        this.notificacion.error(mensajeDeError(error));
      }
    });
  }

  /** Alterna entre las anotaciones de esta historia y las de toda la mascota. */
  alternarAlcance(): void {
    this.verTodaMascota = !this.verTodaMascota;
    this.filtro = { ...this.filtro, page: 0 };
    this.cargar();
  }

  /** Aplica los filtros del formulario. */
  buscar(): void {
    const v = this.filtrosForm.getRawValue();
    this.filtro = { ...this.filtro, page: 0, texto: v.texto?.trim() || undefined, fechaDesde: v.fechaDesde || undefined, fechaHasta: v.fechaHasta || undefined };
    this.cargar();
  }

  /** Limpia los filtros. */
  limpiar(): void {
    this.filtrosForm.reset({ texto: '', fechaDesde: '', fechaHasta: '' });
    this.filtro = { page: 0, size: this.filtro.size, sortBy: 'fecha', sortDir: 'desc' };
    this.cargar();
  }

  /** @param alias Alias de columna entendido por el backend. */
  ordenar(alias: string): void {
    if (this.filtro.sortBy === alias) {
      this.filtro = { ...this.filtro, page: 0, sortDir: this.filtro.sortDir === 'asc' ? 'desc' : 'asc' };
    } else {
      this.filtro = { ...this.filtro, page: 0, sortBy: alias, sortDir: 'asc' };
    }
    this.cargar();
  }

  /** @param pagina Página destino (base 0). */
  cambiarPagina(pagina: number): void {
    this.filtro = { ...this.filtro, page: pagina };
    this.cargar();
  }

  /** @param tamanio Nuevo tamaño de página. */
  cambiarTamanio(tamanio: number): void {
    this.filtro = { ...this.filtro, page: 0, size: tamanio };
    this.cargar();
  }

  /**
   * Consulta y muestra el detalle completo de una anotación.
   *
   * @param anotacion Anotación de la fila.
   */
  verDetalle(anotacion: Anotacion): void {
    this.anotacionService.consultar(anotacion.id).subscribe({
      next: (datos) => (this.detalle = datos),
      error: (error) => this.notificacion.error(mensajeDeError(error))
    });
  }
}
