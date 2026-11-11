import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { FormulaService, Formula, FormulaDetalle } from './service/formula.service';
import { CitaService } from '../cita/service/cita.service';
import { InventarioService, Medicamento } from '../inventario/service/inventario.service';
import { Cita } from 'src/app/models/cita';

/**
 * Pantalla de formulas medicas con varios medicamentos.
 *
 * Permite listar las formulas, crear una formula asociada a una cita con uno o
 * varios medicamentos (cada uno con dosis, frecuencia, duracion, cantidad y via)
 * y descargar el PDF de la formula.
 *
 * Nota: crear la formula no descuenta el inventario; eso ocurre en el despacho.
 */
@Component({
  selector: 'app-formula',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formula.component.html',
  styleUrl: './formula.component.scss'
})
export class FormulaComponent implements OnInit {
  formulas: Formula[] = [];
  citas: Cita[] = [];
  medicamentos: Medicamento[] = [];
  cargando = false;

  modalAbierto = false;
  guardando = false;

  // Modelo del formulario de creacion
  citaId: number | null = null;
  indicaciones = '';
  detalles: FormulaDetalle[] = [];

  constructor(
    private formulaService: FormulaService,
    private citaService: CitaService,
    private inventarioService: InventarioService
  ) {}

  ngOnInit(): void {
    this.cargar();
    this.cargarCitas();
    this.cargarMedicamentos();
  }

  cargar(): void {
    this.cargando = true;
    this.formulaService.listar().subscribe({
      next: (data) => {
        this.cargando = false;
        this.formulas = data;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.manejarError(err, 'No fue posible cargar las formulas');
      }
    });
  }

  cargarCitas(): void {
    this.citaService.listarCitas().subscribe({
      next: (data) => (this.citas = data),
      error: () => (this.citas = [])
    });
  }

  cargarMedicamentos(): void {
    this.inventarioService.listar().subscribe({
      next: (data) => (this.medicamentos = data),
      error: () => (this.medicamentos = [])
    });
  }

  abrirCrear(): void {
    this.citaId = null;
    this.indicaciones = '';
    this.detalles = [this.nuevoDetalle()];
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
  }

  nuevoDetalle(): FormulaDetalle {
    return {
      medicamentoId: null,
      dosis: '',
      frecuencia: '',
      duracion: '',
      cantidad: 1,
      viaAdministracion: ''
    };
  }

  agregarDetalle(): void {
    this.detalles.push(this.nuevoDetalle());
  }

  quitarDetalle(indice: number): void {
    this.detalles.splice(indice, 1);
    if (this.detalles.length === 0) {
      this.detalles.push(this.nuevoDetalle());
    }
  }

  guardar(): void {
    if (this.citaId == null) {
      Swal.fire({ icon: 'warning', title: 'Atencion', text: 'Seleccione una cita.' });
      return;
    }
    const detallesValidos = this.detalles.filter((d) => d.medicamentoId != null);
    if (detallesValidos.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Atencion', text: 'Agregue al menos un medicamento.' });
      return;
    }
    for (const d of detallesValidos) {
      if (!d.dosis || !d.dosis.trim()) {
        Swal.fire({ icon: 'warning', title: 'Atencion', text: 'Cada medicamento debe tener dosis.' });
        return;
      }
    }

    const formula: Formula = {
      citaId: this.citaId,
      indicaciones: this.indicaciones,
      medicamentos: detallesValidos
    };

    this.guardando = true;
    this.formulaService.guardar(formula).subscribe({
      next: (resp) => {
        this.guardando = false;
        this.modalAbierto = false;
        Swal.fire({ icon: 'success', title: 'Listo', text: resp.message });
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando = false;
        this.manejarError(err, 'No fue posible guardar la formula');
      }
    });
  }

  descargarPdf(f: Formula): void {
    if (f.id == null) {
      return;
    }
    this.formulaService.descargarPdf(f.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () =>
        Swal.fire({ icon: 'error', title: 'Error', text: 'No fue posible generar el PDF' })
    });
  }

  etiquetaCita(c: Cita): string {
    const mascota = c.mascota?.nombreMascota ?? c.mascota?.nombre ?? 'Mascota';
    const fecha = c.fechaHora ? String(c.fechaHora).substring(0, 16).replace('T', ' ') : '';
    return `#${c.id} - ${mascota} (${fecha})`;
  }

  private manejarError(err: HttpErrorResponse, mensaje: string): void {
    Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || mensaje });
  }
}
