
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormulaMedicaService } from './service/formula-medica.service';

@Component({
  selector: 'app-formula-medica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formula-medica.component.html',
  styleUrl: './formula-medica.component.scss'
})
export class FormulaMedicaComponent implements OnInit {
  formulas: any[] = [];

  cargando = true;
  guardando = false;
  mostrandoFormulario = false;
  mostrandoDetalle = false;
  modoEdicion = false;

  error = '';
  mensajeFormulario = '';

  formulaId: number | null = null;
  formulaSeleccionada: any = null;

  nuevaFormula = this.formularioVacio();

  // Búsqueda, filtros y ordenación
  busqueda = '';
  filtroDesde = '';
  filtroHasta = '';
  filtroMedicamento = '';

  campoOrden = 'fechaCreacionRegistro';
  direccionOrden: 'asc' | 'desc' = 'desc';

  // Paginación
  paginaActual = 1;
  elementosPorPagina = 5;

  constructor(
    private formulaMedicaService: FormulaMedicaService
  ) {}

  ngOnInit(): void {
    this.listarFormulas();
  }

  formularioVacio() {
    return {
      citaId: null as number | null,
      medicamentoId: null as number | null,
      dosis: '',
      indicaciones: '',
      fechaEmision: '',
      frecuencia: '',
      duracionTratamiento: ''
    };
  }

  listarFormulas(): void {
    this.cargando = true;
    this.error = '';

    this.formulaMedicaService.listarFormulas().subscribe({
      next: (respuesta) => {
        this.formulas = respuesta ?? [];
        this.paginaActual = 1;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al consultar las fórmulas médicas:', err);
        this.error = 'No fue posible cargar las fórmulas médicas.';
        this.cargando = false;
      }
    });
  }

  // Opciones de medicamento disponibles en los registros
  get medicamentosDisponibles(): any[] {
    const opciones = new Map<number, string>();

    this.formulas.forEach((formula) => {
      const id = formula.medicamento?.id ?? formula.medicamentoId;

      if (id != null) {
        const nombre =
          formula.medicamento?.nombre ??
          formula.medicamento?.nombreMedicamento ??
          `Medicamento #${id}`;

        opciones.set(Number(id), nombre);
      }
    });

    return Array.from(opciones, ([id, nombre]) => ({ id, nombre }));
  }

  // Fórmulas que cumplen la búsqueda y los filtros
  get formulasFiltradas(): any[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.formulas.filter((formula) => {
      const medicamentoId =
        formula.medicamento?.id ?? formula.medicamentoId;

      const coincideTexto =
        !texto ||
        [
          formula.id,
          formula.cita?.id ?? formula.citaId,
          medicamentoId,
          formula.dosis,
          formula.indicaciones,
          formula.frecuencia,
          formula.duracionTratamiento
        ].some((valor) =>
          String(valor ?? '').toLowerCase().includes(texto)
        );

      const fecha = String(formula.fechaEmision ?? '').slice(0, 10);

      const coincideDesde =
        !this.filtroDesde || fecha >= this.filtroDesde;

      const coincideHasta =
        !this.filtroHasta || fecha <= this.filtroHasta;

      const coincideMedicamento =
        !this.filtroMedicamento ||
        Number(medicamentoId) === Number(this.filtroMedicamento);

      return (
        coincideTexto &&
        coincideDesde &&
        coincideHasta &&
        coincideMedicamento
      );
    });
  }

  // Ordena por la columna seleccionada
  get formulasOrdenadas(): any[] {
    return [...this.formulasFiltradas].sort((a, b) => {
      const valorA = this.obtenerValorOrden(a, this.campoOrden);
      const valorB = this.obtenerValorOrden(b, this.campoOrden);

      let comparacion = 0;

      if (valorA == null && valorB == null) {
        comparacion = 0;
      } else if (valorA == null) {
        comparacion = -1;
      } else if (valorB == null) {
        comparacion = 1;
      } else if (
        this.campoOrden === 'id' ||
        this.campoOrden === 'fechaEmision' ||
        this.campoOrden === 'fechaCreacionRegistro' ||
        this.campoOrden === 'fechaActualizacionRegistro'
      ) {
        comparacion =
          this.campoOrden === 'id'
            ? Number(valorA) - Number(valorB)
            : new Date(valorA).getTime() - new Date(valorB).getTime();
      } else {
        comparacion = String(valorA).localeCompare(
          String(valorB),
          'es',
          { numeric: true, sensitivity: 'base' }
        );
      }

      return this.direccionOrden === 'asc'
        ? comparacion
        : -comparacion;
    });
  }

  private obtenerValorOrden(formula: any, campo: string): any {
    switch (campo) {
      case 'id':
        return formula.id;
      case 'citaId':
        return formula.cita?.id ?? formula.citaId;
      case 'medicamentoId':
        return formula.medicamento?.id ?? formula.medicamentoId;
      case 'dosis':
        return formula.dosis;
      case 'indicaciones':
        return formula.indicaciones;
      case 'fechaEmision':
        return formula.fechaEmision;
      case 'frecuencia':
        return formula.frecuencia;
      case 'duracionTratamiento':
        return formula.duracionTratamiento;
      case 'fechaCreacionRegistro':
        return formula.fechaCreacionRegistro;
      case 'fechaActualizacionRegistro':
        return formula.fechaActualizacionRegistro;
      default:
        return formula.fechaCreacionRegistro;
    }
  }

  // Cambia la columna o el sentido del orden
  ordenarPor(campo: string): void {
    if (this.campoOrden === campo) {
      this.direccionOrden =
        this.direccionOrden === 'asc' ? 'desc' : 'asc';
    } else {
      this.campoOrden = campo;
      this.direccionOrden = 'asc';
    }

    this.paginaActual = 1;
  }

  get totalPaginas(): number {
    return Math.ceil(
      this.formulasOrdenadas.length / this.elementosPorPagina
    );
  }

  get formulasPaginadas(): any[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;

    return this.formulasOrdenadas.slice(
      inicio,
      inicio + this.elementosPorPagina
    );
  }

  get paginas(): number[] {
    return Array.from(
      { length: this.totalPaginas },
      (_, indice) => indice + 1
    );
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  cambiarElementosPorPagina(cantidad: number | string): void {
    this.elementosPorPagina = Number(cantidad);
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.filtroMedicamento = '';
    this.paginaActual = 1;
  }

  abrirNuevaFormula(): void {
    this.modoEdicion = false;
    this.formulaId = null;
    this.nuevaFormula = this.formularioVacio();
    this.mensajeFormulario = '';
    this.mostrandoDetalle = false;
    this.formulaSeleccionada = null;
    this.mostrandoFormulario = true;
  }

  verDetalle(formula: any): void {
    this.formulaSeleccionada = formula;
    this.mostrandoFormulario = false;
    this.mostrandoDetalle = true;
    this.mensajeFormulario = '';
  }

  cerrarDetalle(): void {
    this.mostrandoDetalle = false;
    this.formulaSeleccionada = null;
  }

  editarFormula(formula: any): void {
    this.modoEdicion = true;
    this.formulaId = formula.id;

    this.nuevaFormula = {
      citaId: formula.cita?.id ?? formula.citaId ?? null,
      medicamentoId:
        formula.medicamento?.id ?? formula.medicamentoId ?? null,
      dosis: formula.dosis ?? '',
      indicaciones: formula.indicaciones ?? '',
      fechaEmision: formula.fechaEmision ?? '',
      frecuencia: formula.frecuencia ?? '',
      duracionTratamiento: formula.duracionTratamiento ?? ''
    };

    this.mostrandoDetalle = false;
    this.formulaSeleccionada = null;
    this.mensajeFormulario = '';
    this.mostrandoFormulario = true;
  }

  guardarFormula(): void {
    if (this.guardando) return;

    this.mensajeFormulario = '';

    if (
      !this.nuevaFormula.citaId ||
      !this.nuevaFormula.medicamentoId ||
      !this.nuevaFormula.dosis.trim() ||
      !this.nuevaFormula.fechaEmision ||
      !this.nuevaFormula.frecuencia.trim() ||
      !this.nuevaFormula.duracionTratamiento.trim()
    ) {
      this.mensajeFormulario = 'Completa todos los campos obligatorios.';
      return;
    }

    if (this.modoEdicion && this.formulaId !== null) {
      this.actualizarFormula();
    } else {
      this.crearFormula();
    }
  }

  crearFormula(): void {
    this.guardando = true;

    this.formulaMedicaService.crearFormula(this.nuevaFormula as any).subscribe({
      next: () =>
        this.finalizarGuardado('La fórmula médica se registró correctamente.'),
      error: (err) => {
        console.error('Error al crear la fórmula médica:', err);
        this.guardando = false;
        this.mensajeFormulario =
          err?.error?.message || 'No fue posible registrar la fórmula médica.';
      }
    });
  }

  actualizarFormula(): void {
    if (this.formulaId === null) return;

    this.guardando = true;

    this.formulaMedicaService.actualizarFormula(
      this.formulaId,
      this.nuevaFormula as any
    ).subscribe({
      next: () =>
        this.finalizarGuardado('La fórmula médica se actualizó correctamente.'),
      error: (err) => {
        console.error('Error al actualizar la fórmula médica:', err);
        this.guardando = false;
        this.mensajeFormulario =
          err?.error?.message || 'No fue posible actualizar la fórmula médica.';
      }
    });
  }

  private finalizarGuardado(mensaje: string): void {
    this.guardando = false;
    this.mensajeFormulario = mensaje;
    this.mostrandoFormulario = false;
    this.listarFormulas();
  }
}
