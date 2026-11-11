import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import { ReportesService, Reporte } from './service/reportes.service';

type Categoria = 'financiero' | 'inventario' | 'gestion';

interface OpcionReporte {
  tipo: string;
  nombre: string;
  /** Indica si el reporte usa realmente el rango de fechas. */
  usaFechas: boolean;
}

/**
 * Pantalla del modulo de reportes.
 *
 * Una sola pantalla con tres pestanas (Financieros, Inventario, Gestion
 * medica). En cada pestana el usuario elige el tipo de reporte y el rango de
 * fechas, genera una vista previa en pantalla y luego exporta el mismo reporte
 * a PDF o Excel.
 *
 * Los tipos declarados aqui coinciden con los que atiende el backend
 * (ReporteServiceImpl). Los reportes marcados con usaFechas=false reflejan el
 * estado actual del inventario; el rango se deja visible por uniformidad con el
 * enunciado, pero no altera su resultado.
 */
@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent implements OnInit {
  categoria: Categoria = 'financiero';

  readonly catalogo: Record<Categoria, OpcionReporte[]> = {
    financiero: [
      { tipo: 'ingresos-periodo', nombre: 'Ingresos por periodo', usaFechas: true },
      { tipo: 'ingresos-consultas', nombre: 'Ingresos por consultas medicas', usaFechas: true },
      { tipo: 'ingresos-medicamentos', nombre: 'Ingresos por venta de medicamentos', usaFechas: true },
      { tipo: 'ingresos-especialidad', nombre: 'Ingresos por especialidad', usaFechas: true },
      { tipo: 'ingresos-veterinario', nombre: 'Ingresos por veterinario', usaFechas: true },
      { tipo: 'facturas-estado', nombre: 'Facturas por estado (pagadas, pendientes, parciales, anuladas)', usaFechas: true },
      { tipo: 'pagos-parciales', nombre: 'Pagos parciales', usaFechas: true },
      { tipo: 'impuestos-descuentos', nombre: 'Impuestos recaudados y descuentos', usaFechas: true },
      { tipo: 'resumen-dia-mes-anio', nombre: 'Resumen de ingresos por dia, mes y anio', usaFechas: true }
    ],
    inventario: [
      { tipo: 'existencias', nombre: 'Existencias actuales', usaFechas: false },
      { tipo: 'valor-inventario', nombre: 'Valor del inventario (costo y venta)', usaFechas: false },
      { tipo: 'agotados', nombre: 'Medicamentos agotados', usaFechas: false },
      { tipo: 'stock-minimo', nombre: 'Medicamentos con stock minimo', usaFechas: false },
      { tipo: 'por-vencer', nombre: 'Medicamentos proximos a vencer', usaFechas: false },
      { tipo: 'vencidos', nombre: 'Medicamentos vencidos', usaFechas: false },
      { tipo: 'movimientos', nombre: 'Entradas y salidas de inventario', usaFechas: true }
    ],
    gestion: [
      { tipo: 'citas-periodo', nombre: 'Citas por periodo', usaFechas: true },
      { tipo: 'citas-estado', nombre: 'Citas por estado (atendidas, canceladas, pendientes)', usaFechas: true },
      { tipo: 'consultas-veterinario', nombre: 'Consultas por veterinario', usaFechas: true },
      { tipo: 'consultas-especialidad', nombre: 'Consultas por especialidad', usaFechas: true },
      { tipo: 'mascotas-atendidas', nombre: 'Mascotas atendidas por periodo', usaFechas: true }
    ]
  };

  tipo = this.catalogo.financiero[0].tipo;
  desde = '';
  hasta = '';

  reporte?: Reporte;
  cargando = false;
  descargando = false;

  constructor(private reportesService: ReportesService) {}

  ngOnInit(): void {
    // Rango por defecto: desde el primer dia del mes actual hasta hoy.
    const hoy = new Date();
    const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.desde = this.aIso(primero);
    this.hasta = this.aIso(hoy);
  }

  get opciones(): OpcionReporte[] {
    return this.catalogo[this.categoria];
  }

  get opcionActual(): OpcionReporte | undefined {
    return this.opciones.find((o) => o.tipo === this.tipo);
  }

  cambiarCategoria(c: Categoria): void {
    this.categoria = c;
    this.tipo = this.catalogo[c][0].tipo;
    this.reporte = undefined;
  }

  generar(): void {
    if (!this.validarFechas()) {
      return;
    }
    this.cargando = true;
    this.reporte = undefined;
    this.reportesService.generar(this.categoria, this.tipo, this.desde, this.hasta).subscribe({
      next: (data) => {
        this.cargando = false;
        this.reporte = data;
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.manejarError(err, 'No fue posible generar el reporte');
      }
    });
  }

  exportarPdf(): void {
    if (!this.validarFechas()) {
      return;
    }
    this.descargando = true;
    this.reportesService.descargarPdf(this.categoria, this.tipo, this.desde, this.hasta).subscribe({
      next: (blob) => {
        this.descargando = false;
        window.open(window.URL.createObjectURL(blob), '_blank');
      },
      error: () => {
        this.descargando = false;
        Swal.fire({ icon: 'error', title: 'Error', text: 'No fue posible generar el PDF' });
      }
    });
  }

  exportarExcel(): void {
    if (!this.validarFechas()) {
      return;
    }
    this.descargando = true;
    this.reportesService.descargarExcel(this.categoria, this.tipo, this.desde, this.hasta).subscribe({
      next: (blob) => {
        this.descargando = false;
        this.descargarArchivo(blob, `reporte-${this.categoria}-${this.tipo}.xlsx`);
      },
      error: () => {
        this.descargando = false;
        Swal.fire({ icon: 'error', title: 'Error', text: 'No fue posible generar el Excel' });
      }
    });
  }

  totalesComoLista(): { etiqueta: string; valor: string }[] {
    if (!this.reporte || !this.reporte.totales) {
      return [];
    }
    return Object.keys(this.reporte.totales).map((k) => ({ etiqueta: k, valor: this.reporte!.totales[k] }));
  }

  private validarFechas(): boolean {
    if (!this.desde || !this.hasta) {
      Swal.fire({ icon: 'warning', title: 'Atencion', text: 'Debe indicar el rango de fechas (desde y hasta).' });
      return false;
    }
    if (this.desde > this.hasta) {
      Swal.fire({ icon: 'warning', title: 'Atencion', text: 'La fecha inicial no puede ser posterior a la final.' });
      return false;
    }
    return true;
  }

  private descargarArchivo(blob: Blob, nombre: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private aIso(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private manejarError(err: HttpErrorResponse, mensaje: string): void {
    Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || mensaje });
  }
}
