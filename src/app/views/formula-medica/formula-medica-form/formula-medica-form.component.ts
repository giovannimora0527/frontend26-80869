import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormulaMedicaService, FormulaMedica } from '../../../services/formula-medica.service';

@Component({
  selector: 'app-formula-medica-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formula-medica-form.component.html',
  styleUrls: ['./formula-medica-form.component.scss']
})
export class FormulaMedicaFormComponent implements OnInit {
  formula: any = {
    cita: { id: null },
    medicamento: { id: null },
    dosis: '',
    indicaciones: ''
  };

  isEditMode = false;
  cargando = false;
  mensaje = '';
  tipoMensaje: 'success' | 'error' = 'success';

  constructor(
    private formulaService: FormulaMedicaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.cargarFormula(Number(id));
    }
  }

  cargarFormula(id: number): void {
    this.cargando = true;
    this.formulaService.getFormulaById(id).subscribe({
      next: (data: any) => {
        this.formula = {
          cita: { id: data.cita.id },
          medicamento: { id: data.medicamento.id },
          dosis: data.dosis,
          indicaciones: data.indicaciones
        };
        this.cargando = false;
      },
      error: () => {
        this.mostrarMensaje('Error al cargar la fórmula', 'error');
        this.cargando = false;
      }
    });
  }

  guardarFormula(): void {
    if (!this.formula.cita.id || !this.formula.medicamento.id || !this.formula.dosis || !this.formula.indicaciones) {
      this.mostrarMensaje('Complete todos los campos obligatorios', 'error');
      return;
    }

    this.cargando = true;
    if (this.isEditMode) {
      // CORRECCIÓN: Pasar ID y el objeto
      this.formulaService.updateFormula(this.formula.id || Number(this.route.snapshot.paramMap.get('id')), this.formula).subscribe({
        next: () => {
          this.cargando = false;
          this.mostrarMensaje('Fórmula actualizada exitosamente', 'success');
          setTimeout(() => this.router.navigate(['/formula-medica']), 2000);
        },
        error: () => {
          this.cargando = false;
          this.mostrarMensaje('Error al actualizar', 'error');
        }
      });
    } else {
      this.formulaService.addFormula(this.formula).subscribe({
        next: () => {
          this.cargando = false;
          this.mostrarMensaje('Fórmula creada exitosamente', 'success');
          setTimeout(() => this.router.navigate(['/formula-medica']), 2000);
        },
        error: () => {
          this.cargando = false;
          this.mostrarMensaje('Error al crear', 'error');
        }
      });
    }
  }

  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
    setTimeout(() => { this.mensaje = ''; }, 4000);
  }

  cancelar(): void {
    this.router.navigate(['/formula-medica']);
  }
}