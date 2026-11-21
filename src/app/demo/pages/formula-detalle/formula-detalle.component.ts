import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';

import { ApiService } from 'src/app/services/api.service';
import { obtenerMensajeError } from 'src/app/utils/mensajes-error';
import { fechaLocalISO } from 'src/app/utils/validadores';
import { FormulaMultiple, ItemFormula, Producto } from 'src/app/models/clinica-extra';
import { FormulaResumen } from 'src/app/models/resumenes';
import { Pagina } from 'src/app/models/pagina';

interface CitaOpcion { id: number; fechaHora: string; estado: string; mascota?: { nombreMascota: string }; cliente?: { nombres: string; apellidos: string }; }

const VIAS = ['ORAL', 'INYECTABLE', 'TOPICA', 'OTICA', 'OFTALMICA', 'OTRA'];

/**
 * Fórmulas médicas con varios medicamentos. Cada línea indica medicamento, dosis, frecuencia,
 * duración, vía de administración y la cantidad que se debe entregar. El backend valida el stock
 * (descontando lo ya formulado por otros veterinarios) y guarda todo en una sola transacción.
 */
@Component({
  selector: 'app-formula-detalle',
  imports: [CommonModule, FormsModule],
  templateUrl: './formula-detalle.component.html'
})
export class FormulaDetalleComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ruta = inject(ActivatedRoute);
  readonly vias = VIAS;

  formulas: FormulaResumen[] = [];
  pagina = 0;
  totalPaginas = 1;
  texto = '';
  cargando = false;
  error = '';

  mostrarForm = false;
  citas: CitaOpcion[] = [];
  medicamentos: Producto[] = [];
  citaId: number | null = null;
  indicaciones = '';
  items: ItemFormula[] = [];
  errorForm = '';
  enviando = false;

  detalle: FormulaMultiple | null = null;

  ngOnInit(): void {
    this.cargar();
    const cita = Number(this.ruta.snapshot.queryParamMap.get('citaId'));
    if (cita) {
      this.nueva();
      this.citaId = cita;
    }
  }

  cargar(pagina = 0): void {
    this.cargando = true;
    this.error = '';
    this.api.get<Pagina<FormulaResumen>>('formula-medica/paginado', { page: pagina, size: 10, q: this.texto }).subscribe({
      next: (p) => { this.formulas = p.content; this.pagina = p.page; this.totalPaginas = Math.max(1, p.totalPages); this.cargando = false; },
      error: (e) => { this.error = obtenerMensajeError(e, 'No fue posible cargar las fórmulas.'); this.cargando = false; }
    });
  }

  // ====================================================================== nueva fórmula

  nueva(): void {
    this.mostrarForm = true;
    this.errorForm = '';
    this.citaId = null;
    this.indicaciones = '';
    this.items = [this.itemVacio()];
    const ini = new Date(Date.now() - 30 * 86400000);
    const fin = new Date(Date.now() + 1 * 86400000);
    this.api.get<CitaOpcion[]>('cita/listar-rango', { fechaInicio: `${fechaLocalISO(ini)}T00:00:00`, fechaFin: `${fechaLocalISO(fin)}T23:59:59` }).subscribe({
      next: (c) => (this.citas = c.filter((x) => x.estado !== 'CANCELADA').sort((a, b) => (a.fechaHora < b.fechaHora ? 1 : -1))),
      error: (e) => (this.errorForm = obtenerMensajeError(e, 'No fue posible cargar las citas.'))
    });
    this.api.get<Producto[]>('inventario/producto/listar', { activo: true }).subscribe({
      next: (p) => (this.medicamentos = p.filter((x) => x.tipo === 'MEDICAMENTO' || x.tipo === 'BIOLOGICO'))
    });
  }

  itemVacio(): ItemFormula {
    return { productoId: null, dosis: '', frecuencia: '', duracion: '', viaAdministracion: 'ORAL', cantidad: 1, indicaciones: '' };
  }

  agregar(): void {
    if (this.items.length < 15) { this.items.push(this.itemVacio()); }
  }

  quitar(i: number): void {
    this.items.splice(i, 1);
    if (this.items.length === 0) { this.items.push(this.itemVacio()); }
  }

  disponible(id: number | null): number | null {
    const p = this.medicamentos.find((m) => m.id === id);
    return p ? p.stock - p.reservado : null;
  }

  guardar(): void {
    if (this.enviando) { return; }
    if (!this.citaId) { this.errorForm = 'Selecciona la cita.'; return; }
    const ids = this.items.map((i) => i.productoId);
    if (ids.some((i) => !i)) { this.errorForm = 'Cada línea debe tener un medicamento.'; return; }
    if (new Set(ids).size !== ids.length) { this.errorForm = 'Un medicamento no puede repetirse en la misma fórmula.'; return; }
    for (const [n, it] of this.items.entries()) {
      if (!it.dosis.trim() || !it.frecuencia.trim() || !it.duracion.trim() || !it.cantidad || it.cantidad < 1) {
        this.errorForm = `Completa dosis, frecuencia, duración y cantidad de la línea ${n + 1}.`;
        return;
      }
    }
    this.enviando = true;
    this.errorForm = '';
    this.api.post<{ message: string }>('formula-detalle/crear', { citaId: this.citaId, indicaciones: this.indicaciones, items: this.items }).subscribe({
      next: (r) => { this.enviando = false; this.mostrarForm = false; Swal.fire({ icon: 'success', title: r.message, timer: 2000, showConfirmButton: false }); this.cargar(0); },
      error: (e) => { this.enviando = false; this.errorForm = obtenerMensajeError(e, 'No fue posible guardar la fórmula.'); }
    });
  }

  nombreCita(c: CitaOpcion): string {
    return `#${c.id} · ${c.fechaHora.replace('T', ' ').substring(0, 16)} · ${c.mascota?.nombreMascota ?? ''} (${c.cliente?.nombres ?? ''} ${c.cliente?.apellidos ?? ''}) · ${c.estado}`;
  }

  // ====================================================================== detalle

  ver(f: FormulaResumen): void {
    this.api.get<FormulaMultiple>(`formula-detalle/${f.id}`).subscribe({
      next: (d) => (this.detalle = d),
      error: (e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible cargar la fórmula.'), 'error')
    });
  }

  pdf(id: number): void {
    this.api.abrirPdf(`formula-detalle/${id}/pdf`).catch((e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible generar el PDF.'), 'error'));
  }

  desactivar(id: number): void {
    Swal.fire({ icon: 'warning', title: '¿Desactivar la fórmula?', text: 'Solo es posible si todavía no se entregó ningún medicamento.', showCancelButton: true, confirmButtonText: 'Desactivar', cancelButtonText: 'Cancelar' }).then((r) => {
      if (!r.isConfirmed) { return; }
      this.api.patch(`formula-detalle/${id}/desactivar`).subscribe({
        next: () => { this.detalle = null; this.cargar(this.pagina); },
        error: (e) => Swal.fire('No se pudo desactivar', obtenerMensajeError(e, 'No fue posible desactivar la fórmula.'), 'error')
      });
    });
  }
}
