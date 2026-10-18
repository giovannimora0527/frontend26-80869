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
 * Histórico de anotaciones de una historia clínica en un DataTable: filtrar, ordenar por fecha,
 * paginar y consultar el detalle de una anotación. Se reutiliza en el modal "Ver" de la historia
 * clínica y en la pantalla de anotaciones. Siempre muestra primero la anotación más reciente.
 */
@Component({
  selector: 'app-anotaciones-tabla',
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  templateUrl: './anotaciones-tabla.component.html'
})
export class AnotacionesTablaComponent implements OnChanges {
  /** Historia de la que se muestran las anotaciones. */
  @Input() historiaId: number | null = null;
  /** Contador que el padre incrementa para forzar la recarga (p. ej. tras crear una anotación). */
  @Input() refrescar = 0;

  /** Columnas del DataTable (alias de orden válidos en el backend: fecha y medico). */
  readonly columnas: ColumnaTabla[] = [
    { campo: 'fecha', titulo: 'Fecha y hora', ordenPor: 'fecha', formato: 'fechaHora' },
    { campo: 'medicoNombre', titulo: 'Veterinario', ordenPor: 'medico' },
    { campo: 'descripcion', titulo: 'Descripción', max: 60 },
    { campo: 'diagnosticoEvolucion', titulo: 'Diagnóstico / evolución', max: 60 }
  ];

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

  /** Reinicia la consulta cuando cambia la historia o el contador de refresco. */
  ngOnChanges(): void {
    this.detalle = null;
    this.filtro = { ...this.filtro, page: 0 };
    this.cargar();
  }

  /** Consulta la página actual del histórico de la historia seleccionada. */
  cargar(): void {
    if (!this.historiaId) {
      this.pagina = null;
      return;
    }
    this.cargando = true;
    this.anotacionService.listarPorHistoria(this.historiaId, this.filtro).subscribe({
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

  /** Aplica los filtros del formulario. */
  buscar(): void {
    const v = this.filtrosForm.getRawValue();
    this.filtro = { ...this.filtro, page: 0, texto: v.texto?.trim() || undefined, fechaDesde: v.fechaDesde || undefined, fechaHasta: v.fechaHasta || undefined };
    this.cargar();
  }

  /** Limpia los filtros y restablece el orden (fecha descendente). */
  limpiar(): void {
    this.filtrosForm.reset({ texto: '', fechaDesde: '', fechaHasta: '' });
    this.filtro = { page: 0, size: this.filtro.size, sortBy: 'fecha', sortDir: 'desc' };
    this.cargar();
  }

  /**
   * Cambia el orden: misma columna alterna la dirección, otra columna ordena ascendente.
   *
   * @param alias Alias de columna entendido por el backend.
   */
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
