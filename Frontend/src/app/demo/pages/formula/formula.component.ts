import { Component } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import Swal from 'sweetalert2';
import { Modal } from 'bootstrap';

import { Formula, FormulaRequest } from 'src/app/models/formula';
import { Cita } from 'src/app/models/cita';
import { Medicamento } from 'src/app/models/medicamento';
import { FormulaService } from './service/formula.service';
import { CitaService } from '../cita/service/cita.service';
import { MedicamentoService } from 'src/app/services/medicamento.service';

/** Columnas por las que se puede ordenar la tabla de formulas. */
type ColumnaOrden = 'fecha' | 'cita' | 'medicamento';

/**
 * Componente que gestiona el listado, creacion, edicion y visualizacion de
 * formulas medicas. Implementa paginacion, filtro y ordenamiento.
 */
@Component({
  selector: 'app-formula',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './formula.component.html',
  styleUrl: './formula.component.scss'
})
export class FormulaComponent {

  /** Instancia del modal de formulario. */
  private modalForm: Modal | null = null;
  /** Instancia del modal de detalle. */
  private modalDetalle: Modal | null = null;
  /** Titulo del modal segun el modo. */
  titleModal = '';
  /** Texto del boton principal. */
  titleBoton = '';
  /** Modo del formulario: 'C' crear, 'E' editar. */
  modoFormulario = '';

  /** Listado de formulas obtenido del backend. */
  listFormulas: Formula[] = [];
  /** Catalogos para combos y para resolver nombres. */
  listCitas: Cita[] = [];
  listMedicamentos: Medicamento[] = [];

  /** Formula seleccionada para ver detalle. */
  formulaDetalle: Formula | null = null;

  /** Termino de busqueda del filtro de texto. */
  terminoBusqueda = '';
  /** Pagina actual de la tabla. */
  paginaActual = 1;
  /** Registros por pagina. */
  readonly registrosPorPagina = 5;
  /** Columna de ordenamiento. Por defecto fecha descendente. */
  columnaOrden: ColumnaOrden = 'fecha';
  /** Direccion del ordenamiento. */
  direccionOrden: 'asc' | 'desc' = 'desc';

  /** Formulario reactivo de la formula. */
  form!: FormGroup;
  /** Formula seleccionada para edicion. */
  formulaSelected: Formula | null = null;
  /** Bandera de envio en curso. */
  enviando = false;

  constructor(
    private readonly formulaService: FormulaService,
    private readonly citaService: CitaService,
    private readonly medicamentoService: MedicamentoService,
    private readonly formBuilder: FormBuilder
  ) {
    this.inicializarFormulario();
    this.listar();
    this.listarCitas();
    this.listarMedicamentos();
  }

  /**
   * Inicializa el formulario reactivo con sus validaciones.
   */
  private inicializarFormulario(): void {
    this.form = this.formBuilder.group({
      citaId: [null, Validators.required],
      medicamentoId: [null, Validators.required],
      dosis: ['', [Validators.required, Validators.maxLength(300)]],
      frecuencia: ['', [Validators.required, Validators.maxLength(100)]],
      duracion: ['', [Validators.required, Validators.maxLength(100)]],
      indicaciones: ['', Validators.maxLength(500)],
      fechaEmision: ['', Validators.required]
    });
  }

  /** Acceso rapido a los controles del formulario. */
  get f(): { [key: string]: AbstractControl } {
    return this.form.controls;
  }

  /**
   * Carga el listado de formulas desde el backend.
   */
  listar(): void {
    this.formulaService.listarFormulas().subscribe({
      next: (data) => {
        this.listFormulas = data ?? [];
        this.paginaActual = 1;
      },
      error: (error) => Swal.fire('Error', this.obtenerMensajeError(error), 'error')
    });
  }

  /**
   * Carga el catalogo de citas para el combo.
   */
  listarCitas(): void {
    this.citaService.listarCitas().subscribe({
      next: (data) => (this.listCitas = data ?? []),
      error: (error) => console.error('Error al listar citas:', error)
    });
  }

  /**
   * Carga el catalogo de medicamentos para el combo.
   */
  listarMedicamentos(): void {
    this.medicamentoService.listarMedicamentos().subscribe({
      next: (data) => (this.listMedicamentos = data ?? []),
      error: (error) => console.error('Error al listar medicamentos:', error)
    });
  }

  /**
   * Filtra, ordena y retorna las formulas a mostrar.
   */
  get formulasFiltradas(): Formula[] {
    const termino = this.normalizarTexto(this.terminoBusqueda.trim());
    const filtradas = this.listFormulas.filter((formula) => {
      if (!termino) {
        return true;
      }
      const valores = [
        this.descripcionCita(formula.citaId),
        this.nombreMedicamento(formula.medicamentoId),
        formula.dosis,
        formula.fechaCreacionRegistro
          ? formatDate(formula.fechaCreacionRegistro, 'yyyy-MM-dd HH:mm', 'en-US')
          : ''
      ];
      return valores.some((valor) => this.normalizarTexto(String(valor ?? '')).includes(termino));
    });

    return [...filtradas].sort((a, b) => {
      const valorA = this.valorOrden(a, this.columnaOrden);
      const valorB = this.valorOrden(b, this.columnaOrden);
      const comparacion = typeof valorA === 'number' && typeof valorB === 'number'
        ? valorA - valorB
        : String(valorA).localeCompare(String(valorB), 'es', { numeric: true, sensitivity: 'base' });
      return this.direccionOrden === 'asc' ? comparacion : -comparacion;
    });
  }

  /**
   * Obtiene el valor por el que se ordena una formula.
   */
  private valorOrden(formula: Formula, columna: ColumnaOrden): string | number {
    switch (columna) {
      case 'fecha':
        return formula.fechaCreacionRegistro ? new Date(formula.fechaCreacionRegistro).getTime() : 0;
      case 'cita':
        return this.descripcionCita(formula.citaId);
      case 'medicamento':
        return this.nombreMedicamento(formula.medicamentoId);
    }
  }

  /**
   * Cambia la columna/direccion de ordenamiento.
   */
  ordenarPor(columna: ColumnaOrden): void {
    if (this.columnaOrden === columna) {
      this.direccionOrden = this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.columnaOrden = columna;
      this.direccionOrden = 'asc';
    }
    this.paginaActual = 1;
  }

  /** Formulas de la pagina actual. */
  get formulasPaginadas(): Formula[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    return this.formulasFiltradas.slice(inicio, inicio + this.registrosPorPagina);
  }

  /** Numero total de paginas. */
  get totalPaginas(): number {
    return Math.ceil(this.formulasFiltradas.length / this.registrosPorPagina);
  }

  /** Arreglo de numeros de pagina. */
  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  /**
   * Actualiza el termino de busqueda y reinicia la paginacion.
   */
  actualizarBusqueda(event: Event): void {
    this.terminoBusqueda = (event.target as HTMLInputElement).value;
    this.paginaActual = 1;
  }

  /**
   * Cambia de pagina validando limites.
   */
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  /**
   * Describe una cita (id + fecha) a partir de su identificador.
   */
  descripcionCita(citaId?: number): string {
    const cita = this.listCitas.find((c) => c.id === citaId);
    if (!cita) {
      return `#${citaId ?? ''}`;
    }
    const fecha = cita.fechaHora ? formatDate(cita.fechaHora, 'yyyy-MM-dd HH:mm', 'en-US') : '';
    return `Cita #${cita.id} (${fecha})`;
  }

  /**
   * Resuelve el nombre de un medicamento a partir de su id.
   */
  nombreMedicamento(medicamentoId?: number): string {
    const medicamento = this.listMedicamentos.find((m) => m.id === medicamentoId);
    return medicamento ? (medicamento.nombre ?? '') : `#${medicamentoId ?? ''}`;
  }

  /**
   * Abre el modal en modo creacion.
   */
  nuevaFormula(): void {
    this.modoFormulario = 'C';
    this.formulaSelected = null;
    this.form.reset();
    this.openModalForm('C');
  }

  /**
   * Abre el modal en modo edicion cargando los datos de la formula.
   *
   * @param formula formula a editar.
   */
  abrirEdicion(formula: Formula): void {
    this.modoFormulario = 'E';
    this.formulaSelected = formula;
    this.form.patchValue({
      citaId: formula.citaId ?? null,
      medicamentoId: formula.medicamentoId ?? null,
      dosis: formula.dosis ?? '',
      frecuencia: formula.frecuencia ?? '',
      duracion: formula.duracion ?? '',
      indicaciones: formula.indicaciones ?? '',
      fechaEmision: formula.fechaCreacionRegistro
        ? formatDate(formula.fechaCreacionRegistro, 'yyyy-MM-dd', 'en-US')
        : ''
    });
    this.openModalForm('E');
  }

  /**
   * Abre el modal de detalle (solo lectura) de una formula.
   *
   * @param formula formula a visualizar.
   */
  verDetalle(formula: Formula): void {
    this.formulaDetalle = formula;
    const modalElement = document.getElementById('modalDetalleFormula');
    if (modalElement) {
      this.modalDetalle ??= new Modal(modalElement);
      this.modalDetalle.show();
    }
  }

  /**
   * Valida y envia el formulario para crear o actualizar la formula.
   */
  guardarFormula(): void {
    if (this.form.invalid || this.enviando) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const request: FormulaRequest = {
      id: this.modoFormulario === 'E' ? this.formulaSelected?.id : undefined,
      citaId: Number(valores.citaId),
      medicamentoId: Number(valores.medicamentoId),
      dosis: valores.dosis,
      frecuencia: valores.frecuencia,
      duracion: valores.duracion,
      indicaciones: valores.indicaciones,
      // Se envia como fecha-hora al inicio del dia seleccionado.
      fechaEmision: valores.fechaEmision ? `${valores.fechaEmision}T00:00:00` : undefined
    };

    this.enviando = true;
    const solicitud = this.modoFormulario === 'C'
      ? this.formulaService.crearFormula(request)
      : this.formulaService.actualizarFormula(request);

    solicitud.subscribe({
      next: () => {
        this.enviando = false;
        this.closeModalForm();
        this.listar();
        Swal.fire('Operacion exitosa',
          this.modoFormulario === 'C' ? 'La formula fue creada correctamente.' : 'La formula fue actualizada correctamente.',
          'success');
      },
      error: (error) => {
        this.enviando = false;
        Swal.fire('Error', this.obtenerMensajeError(error), 'error');
      }
    });
  }

  /**
   * Abre el modal de formulario configurando titulos.
   */
  private openModalForm(modo: string): void {
    this.titleModal = modo === 'C' ? 'Registrar Formula' : 'Editar Formula';
    this.titleBoton = modo === 'C' ? 'Guardar Formula' : 'Actualizar Formula';
    const modalElement = document.getElementById('modalFormula');
    if (modalElement) {
      this.modalForm ??= new Modal(modalElement);
      this.modalForm.show();
    }
  }

  /**
   * Cierra el modal de formulario.
   */
  closeModalForm(): void {
    this.modalForm?.hide();
  }

  /**
   * Cierra el modal de detalle.
   */
  closeModalDetalle(): void {
    this.modalDetalle?.hide();
  }

  /**
   * Normaliza texto para busquedas.
   */
  private normalizarTexto(texto: string): string {
    return texto.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Extrae un mensaje de error legible de la respuesta del backend.
   */
  private obtenerMensajeError(error: unknown): string {
    const err = error as { error?: { message?: string }; message?: string };
    return err?.error?.message ?? err?.message ?? 'Ocurrio un error inesperado.';
  }
}
