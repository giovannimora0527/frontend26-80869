import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FormulaMedicaService } from '../service/formula-medica.service';
import { FormulaMedica } from '../../../../models/formula-medica';

/**
 * Componente de formulario para crear/editar fórmulas médicas.
 * @author Yulian Montealegre
 */
@Component({
  selector: 'app-formula-medica-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formula-medica-form.component.html',
  styleUrls: ['./formula-medica-form.component.scss']
})
export class FormulaMedicaFormComponent implements OnInit {
  formula: FormulaMedica = {
    id: 0,
    citaId: 0,
    medicamentoId: 0,
    dosis: '',
    indicaciones: '',
    fechaCreacionRegistro: new Date().toISOString(),
    fechaActualizacionRegistro: new Date().toISOString()
  };

  esEdicion: boolean = false;
  formulaId: number | null = null;
  mensajeError: string = '';
  guardando: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private formulaService: FormulaMedicaService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.esEdicion = true;
        this.formulaId = +params['id'];
      }
    });
  }

  guardar(): void {
    this.mensajeError = '';

    if (!this.formula.citaId || !this.formula.medicamentoId || !this.formula.dosis || !this.formula.indicaciones) {
      this.mensajeError = 'Los campos ID Cita, ID Medicamento, Dosis e Indicaciones son obligatorios';
      return;
    }

    this.guardando = true;

    if (this.esEdicion && this.formulaId) {
      this.formula.fechaActualizacionRegistro = new Date().toISOString();
      this.formulaService.actualizarFormula(this.formulaId, this.formula).subscribe({
        next: () => {
          this.router.navigate(['/inicio/formulas-medicas']);
        },
        error: (err) => {
          console.error('Error al actualizar:', err);
          this.mensajeError = 'Error al actualizar. Verifica que el backend esté corriendo.';
          this.guardando = false;
        }
      });
    } else {
      this.formulaService.crearFormula(this.formula).subscribe({
        next: () => {
          this.router.navigate(['/inicio/formulas-medicas']);
        },
        error: (err) => {
          console.error('Error al crear:', err);
          this.mensajeError = 'Error al crear. Verifica que el backend esté corriendo.';
          this.guardando = false;
        }
      });
    }
  }

  cancelar(): void {
    this.router.navigate(['/inicio/formulas-medicas']);
  }
}