import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormulaMedicaService } from './service/formula-medica.service';
import { FormulaMedica } from '../../../models/formula-medica';

/**
 * Componente para gestionar y visualizar fórmulas médicas.
 * Muestra la tabla con los datos y los botones de acción.
 * @author Yulian Montealegre
 */
@Component({
  selector: 'app-formula-medica',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formula-medica.component.html',
  styleUrls: ['./formula-medica.component.scss']
})
export class FormulaMedicaComponent implements OnInit {
  formulas: FormulaMedica[] = [];
  cargando: boolean = true;

  constructor(
    private formulaService: FormulaMedicaService,
    private router: Router // <-- IMPORTANTE: Aquí va el Router
  ) { }

  ngOnInit(): void {
    this.cargarFormulas();
  }

  cargarFormulas(): void {
    this.cargando = true;
    this.formulaService.obtenerFormulas().subscribe({
      next: (data) => {
        this.formulas = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar fórmulas:', err);
        this.cargando = false;
      }
    });
  }

  // ✅ ESTOS MÉTODOS VAN AQUÍ, EN LA LISTA
  irANuevo(): void {
    this.router.navigate(['/inicio/formulas-medicas/nuevo']);
  }

  editarFormula(formula: FormulaMedica): void {
    this.router.navigate(['/inicio/formulas-medicas/editar', formula.id]);
  }
}