
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
  modoEdicion = false;

  error = '';
  mensajeFormulario = '';

  formulaId: number | null = null;

  nuevaFormula = this.formularioVacio();

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
        this.formulas = respuesta;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al consultar las fórmulas médicas:', err);
        this.error = 'No fue posible cargar las fórmulas médicas.';
        this.cargando = false;
      }
    });
  }

  abrirNuevaFormula(): void {
    this.modoEdicion = false;
    this.formulaId = null;
    this.nuevaFormula = this.formularioVacio();
    this.mensajeFormulario = '';
    this.mostrandoFormulario = true;
  }

  editarFormula(formula: any): void {
    this.modoEdicion = true;
    this.formulaId = formula.id;

    this.nuevaFormula = {
      citaId: formula.cita?.id ?? null,
      medicamentoId: formula.medicamento?.id ?? null,
      dosis: formula.dosis ?? '',
      indicaciones: formula.indicaciones ?? '',
      fechaEmision: formula.fechaEmision ?? '',
      frecuencia: formula.frecuencia ?? '',
      duracionTratamiento: formula.duracionTratamiento ?? ''
    };

    this.mensajeFormulario = '';
    this.mostrandoFormulario = true;
  }

  guardarFormula(): void {
    if (this.guardando) {
      return;
    }

    this.mensajeFormulario = '';

    if (
      !this.nuevaFormula.citaId ||
      !this.nuevaFormula.medicamentoId ||
      !this.nuevaFormula.dosis.trim() ||
      !this.nuevaFormula.fechaEmision ||
      !this.nuevaFormula.frecuencia.trim() ||
      !this.nuevaFormula.duracionTratamiento.trim()
    ) {
      this.mensajeFormulario =
        'Completa todos los campos obligatorios.';
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

    this.formulaMedicaService.crearFormula(
      this.nuevaFormula as any
    ).subscribe({
      next: () => {
        this.finalizarGuardado(
          'La fórmula médica se registró correctamente.'
        );
      },
      error: (err) => {
        console.error('Error al crear la fórmula médica:', err);
        this.guardando = false;
        this.mensajeFormulario =
          err?.error?.message ||
          'No fue posible registrar la fórmula médica.';
      }
    });
  }

  actualizarFormula(): void {
    if (this.formulaId === null) {
      return;
    }

    this.guardando = true;

    this.formulaMedicaService.actualizarFormula(
      this.formulaId,
      this.nuevaFormula as any
    ).subscribe({
      next: () => {
        this.finalizarGuardado(
          'La fórmula médica se actualizó correctamente.'
        );
      },
      error: (err) => {
        console.error('Error al actualizar la fórmula médica:', err);
        this.guardando = false;
        this.mensajeFormulario =
          err?.error?.message ||
          'No fue posible actualizar la fórmula médica.';
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
