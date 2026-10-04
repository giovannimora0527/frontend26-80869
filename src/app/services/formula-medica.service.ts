import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface FormulaMedica {
  id: number;
  paciente: string;
  medicamento: string;
  dosis: string;
  indicaciones: string;
  fechaEmision: string;
  fechaVencimiento: string;
  medico: string;
}

@Injectable({
  providedIn: 'root'
})
export class FormulaMedicaService {
  private formulas: FormulaMedica[] = [
    {
      id: 1,
      paciente: 'Juan Pérez',
      medicamento: 'Acetaminofén',
      dosis: '500mg cada 8h',
      indicaciones: 'Tomar después de las comidas',
      fechaEmision: '2026-10-01',
      fechaVencimiento: '2026-11-01',
      medico: 'Dra. María López'
    },
    {
      id: 2,
      paciente: 'Ana Gómez',
      medicamento: 'Ibuprofeno',
      dosis: '400mg cada 12h',
      indicaciones: 'Solo si hay dolor intenso',
      fechaEmision: '2026-10-03',
      fechaVencimiento: '2026-11-03',
      medico: 'Dr. Carlos Ruiz'
    },
    {
      id: 3,
      paciente: 'Luis Ramírez',
      medicamento: 'Amoxicilina',
      dosis: '500mg cada 8h',
      indicaciones: 'Completar 7 días de tratamiento',
      fechaEmision: '2026-10-04',
      fechaVencimiento: '2026-11-04',
      medico: 'Dra. Patricia Vega'
    }
  ];

  constructor() {}

  getFormulas(): Observable<FormulaMedica[]> {
    return of(this.formulas);
  }

  getFormulaById(id: number): Observable<FormulaMedica | undefined> {
    return of(this.formulas.find(f => f.id === id));
  }

  addFormula(formula: FormulaMedica): void {
    this.formulas.push(formula);
  }

  updateFormula(formula: FormulaMedica): void {
    const index = this.formulas.findIndex(f => f.id === formula.id);
    if (index !== -1) {
      this.formulas[index] = formula;
    }
  }
}