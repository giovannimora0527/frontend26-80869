import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormulaMedicaService, FormulaMedica } from '../../../services/formula-medica.service';

@Component({
  selector: 'app-formula-medica-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './formula-medica-list.component.html',
  styleUrls: ['./formula-medica-list.component.scss']
})
export class FormulaMedicaListComponent implements OnInit {
  formulas: FormulaMedica[] = [];

  constructor(private formulaService: FormulaMedicaService) {}

  ngOnInit(): void {
    this.formulaService.getFormulas().subscribe((data: FormulaMedica[]) => {
      this.formulas = data;
    });
  }
}