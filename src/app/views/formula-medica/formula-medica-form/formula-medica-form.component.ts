import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormulaMedicaService, FormulaMedica } from '../../../services/formula-medica.service';

@Component({
  selector: 'app-formula-medica-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './formula-medica-form.component.html',
  styleUrls: ['./formula-medica-form.component.scss']
})
export class FormulaMedicaFormComponent implements OnInit {
  formula: FormulaMedica = {
    id: 0,
    paciente: '',
    medicamento: '',
    dosis: '',
    indicaciones: '',
    fechaEmision: '',
    fechaVencimiento: '',
    medico: ''
  };

  isEditMode = false;

  constructor(
    private formulaService: FormulaMedicaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.formulaService.getFormulaById(Number(id)).subscribe((data: FormulaMedica | undefined) => {
        if (data) {
          this.formula = data;
        }
      });
    }
  }

  guardar(): void {
    if (this.isEditMode) {
      this.formulaService.updateFormula(this.formula);
    } else {
      this.formula.id = Date.now();
      this.formulaService.addFormula(this.formula);
    }
    this.router.navigate(['/formula-medica']);
  }

  cancelar(): void {
    this.router.navigate(['/formula-medica']);
  }
}