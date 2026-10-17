import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormulaDetalle, FormulaFiltro, FormulaResumen } from 'src/app/models/formula-medica';
import { Medicamento } from 'src/app/models/medicamento';
import { Medico } from 'src/app/models/medico';
import { PageResponse } from 'src/app/models/page-response';
import { NotificacionService } from 'src/app/services/notificacion.service';
import { ColumnaTabla, DataTableComponent } from 'src/app/shared/data-table/data-table.component';
import { mensajeDeError } from 'src/app/utils/api-error';
import { abrirModal } from 'src/app/utils/modal';
import { MedicamentoService } from '../medicamento/service/medicamento.service';
import { MedicoServiceService } from '../medico/service/medico-service.service';
import { FormulaMedicaService } from './service/formula-medica.service';

/**
 * Listado de fórmulas médicas: DataTable paginado en el servidor (orden inicial por fecha de
 * creación descendente), filtros, detalle completo, edición e inactivación lógica.
 * El listado muestra información resumida; el detalle completo se ve en el modal "Ver".
 */
@Component({
  selector: 'app-formula-medica',
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent],
  templateUrl: './formula-medica.component.html',
  styleUrls: ['./formula-medica.component.scss']
})
export class FormulaMedicaComponent implements OnInit {
  /** Id del modal de detalle. */
  readonly modalId = 'modalFormulaDetalle';
  /** Columnas resumidas del listado. */
  readonly columnas: ColumnaTabla[] = [
    { campo: 'fechaEmision', titulo: 'Emisión', ordenPor: 'fechaEmision', formato: 'fecha' },
    { campo: 'mascotaNombre', titulo: 'Mascota', ordenPor: 'mascota' },
    { campo: 'clienteNombre', titulo: 'Cliente', ordenPor: 'cliente' },
    { campo: 'medicoNombre', titulo: 'Veterinario', ordenPor: 'medico' },
    { campo: 'medicamentoNombre', titulo: 'Medicamento', ordenPor: 'medicamento' },
    { campo: 'frecuencia', titulo: 'Frecuencia' },
    { campo: 'duracionDias', titulo: 'Días' },
    { campo: 'activo', titulo: 'Estado', ordenPor: 'activo', formato: 'activo' }
  ];

  /** Página actual de fórmulas. */
  pagina: PageResponse<FormulaResumen> | null = null;
  /** Indica si hay una consulta en curso. */
  cargando = false;
  /** Paginación, orden y filtros vigentes (inicial: creación descendente). */
  filtro: FormulaFiltro = { page: 0, size: 10, sortBy: 'fechaCreacion', sortDir: 'desc' };
  /** Veterinarios para el filtro. */
  medicos: Medico[] = [];
  /** Medicamentos para el filtro. */
  medicamentos: Medicamento[] = [];
  /** Formulario de filtros. */
  filtrosForm!: FormGroup;
  /** Fórmula mostrada en el modal de detalle. */
  detalle: FormulaDetalle | null = null;

  /**
   * @param formulaService Servicio de fórmulas.
   * @param medicoService Servicio de veterinarios.
   * @param medicamentoService Servicio de medicamentos.
   * @param notificacion Mensajes al usuario.
   * @param formBuilder Constructor de formularios reactivos.
   * @param router Navegación a las pantallas de crear/editar.
   */
  constructor(
    private readonly formulaService: FormulaMedicaService,
    private readonly medicoService: MedicoServiceService,
    private readonly medicamentoService: MedicamentoService,
    private readonly notificacion: NotificacionService,
    private readonly formBuilder: FormBuilder,
    private readonly router: Router
  ) {}

  /** Inicializa filtros, combos y la primera página. */
  ngOnInit(): void {
    this.filtrosForm = this.formBuilder.group({
      texto: [''],
      medicoId: [''],
      medicamentoId: [''],
      activo: [''],
      fechaDesde: [''],
      fechaHasta: ['']
    });
    this.medicoService.listarMedicos().subscribe({ next: (d) => (this.medicos = d), error: (e) => this.notificacion.error(mensajeDeError(e)) });
    this.medicamentoService.listarMedicamentos().subscribe({ next: (d) => (this.medicamentos = d), error: (e) => this.notificacion.error(mensajeDeError(e)) });
    this.cargar();
  }

  /** Consulta la página actual en el servidor. */
  cargar(): void {
    this.cargando = true;
    this.formulaService.listar(this.filtro).subscribe({
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

  /** Aplica los filtros del formulario y vuelve a la primera página. */
  buscar(): void {
    const v = this.filtrosForm.getRawValue();
    this.filtro = {
      ...this.filtro,
      page: 0,
      texto: v.texto?.trim() || undefined,
      medicoId: v.medicoId ? Number(v.medicoId) : undefined,
      medicamentoId: v.medicamentoId ? Number(v.medicamentoId) : undefined,
      activo: v.activo === '' ? undefined : v.activo === 'true',
      fechaDesde: v.fechaDesde || undefined,
      fechaHasta: v.fechaHasta || undefined
    };
    this.cargar();
  }

  /** Limpia filtros y restablece el orden inicial (creación descendente). */
  limpiar(): void {
    this.filtrosForm.reset({ texto: '', medicoId: '', medicamentoId: '', activo: '', fechaDesde: '', fechaHasta: '' });
    this.filtro = { page: 0, size: this.filtro.size, sortBy: 'fechaCreacion', sortDir: 'desc' };
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

  /** Navega al formulario de creación. */
  irANuevo(): void {
    void this.router.navigate(['/inicio/formulas-medicas/nuevo']);
  }

  /**
   * Navega al formulario de edición.
   *
   * @param formula Fórmula de la fila.
   */
  editarFormula(formula: FormulaResumen): void {
    void this.router.navigate(['/inicio/formulas-medicas/editar', formula.id]);
  }

  /**
   * Carga y muestra el detalle completo de la fórmula.
   *
   * @param formula Fórmula de la fila.
   */
  verDetalle(formula: FormulaResumen): void {
    this.formulaService.consultar(formula.id).subscribe({
      next: (datos) => {
        this.detalle = datos;
        abrirModal(this.modalId);
      },
      error: (error) => this.notificacion.error(mensajeDeError(error))
    });
  }

  /**
   * Inactiva (o reactiva) la fórmula previa confirmación. Nunca se elimina físicamente.
   *
   * @param formula Fórmula de la fila.
   */
  async cambiarActivo(formula: FormulaResumen): Promise<void> {
    const accion = formula.activo ? 'inactivar' : 'activar';
    const confirmado = await this.notificacion.confirmar(`¿Desea ${accion} la fórmula de ${formula.mascotaNombre}?`);
    if (!confirmado) {
      return;
    }
    const solicitud = formula.activo ? this.formulaService.inactivar(formula.id) : this.formulaService.activar(formula.id);
    solicitud.subscribe({
      next: () => {
        this.notificacion.exito(formula.activo ? 'La fórmula fue inactivada.' : 'La fórmula fue activada.');
        this.cargar();
      },
      error: (error) => this.notificacion.error(mensajeDeError(error))
    });
  }
}
