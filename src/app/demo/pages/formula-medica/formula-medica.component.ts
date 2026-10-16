import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormulaMedicaService } from './service/formula-medica.service';

@Component({
  selector: 'app-formula-medica',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './formula-medica.component.html',
  styleUrl: './formula-medica.component.scss'
})
export class FormulaMedicaComponent implements OnInit {

  formulas: any[] = [];
  cargando = true;
  error = '';

  constructor(
    private formulaMedicaService: FormulaMedicaService
  ) {}

  ngOnInit(): void {
    this.listarFormulas();
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
}
