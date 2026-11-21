import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { ApiService } from 'src/app/services/api.service';
import { obtenerMensajeError } from 'src/app/utils/mensajes-error';
import { Servicio } from 'src/app/models/clinica-extra';

interface Antecedente { fecha: string; veterinario: string; descripcion: string; diagnostico?: string; observaciones?: string; }
interface Atencion {
  atencionId?: number; citaId: number; fechaCita: string; estadoCita: string; estado: string; fechaInicio?: string; fechaFin?: string;
  mascotaId: number; mascota: string; edad?: number; raza?: string; especie?: string; clienteId: number; propietario: string;
  documento: string; telefono?: string; veterinario: string; especialidad?: string; motivo?: string; sintomas?: string;
  diagnostico?: string; observaciones?: string; recomendaciones?: string; antecedentes: Antecedente[];
}

/**
 * Atención médica de una cita: datos de la mascota y antecedentes, registro de motivo, síntomas, diagnóstico,
 * observaciones y recomendaciones, fórmula médica y prefactura en PDF. Al finalizar, la cita queda ATENDIDA y todo
 * se guarda en el historial clínico de la mascota.
 */
@Component({
  selector: 'app-atencion',
  imports: [CommonModule, FormsModule],
  templateUrl: './atencion.component.html'
})
export class AtencionComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);

  citaId = 0;
  atencion: Atencion | null = null;
  form = { motivo: '', sintomas: '', diagnostico: '', observaciones: '', recomendaciones: '' };
  error = '';
  cargando = false;
  guardando = false;

  servicios: Servicio[] = [];
  cantidades: Record<number, number> = {};
  filtroServicio = '';

  ngOnInit(): void {
    this.citaId = Number(this.ruta.snapshot.paramMap.get('citaId'));
    this.cargar();
    this.api.get<Servicio[]>('servicio/listar', { soloActivos: true }).subscribe({ next: (s) => (this.servicios = s) });
  }

  get finalizada(): boolean {
    return this.atencion?.estado === 'FINALIZADA';
  }

  cargar(): void {
    this.cargando = true;
    this.api.get<Atencion>(`atencion/cita/${this.citaId}`).subscribe({
      next: (a) => {
        this.atencion = a;
        this.form = { motivo: a.motivo ?? '', sintomas: a.sintomas ?? '', diagnostico: a.diagnostico ?? '', observaciones: a.observaciones ?? '', recomendaciones: a.recomendaciones ?? '' };
        this.cargando = false;
      },
      error: (e) => { this.cargando = false; this.error = obtenerMensajeError(e, 'No fue posible cargar la atención.'); }
    });
  }

  private valido(): boolean {
    const f = this.form;
    if (f.motivo.trim().length < 5 || f.sintomas.trim().length < 5 || f.diagnostico.trim().length < 5) {
      this.error = 'Motivo, síntomas y diagnóstico son obligatorios (mínimo 5 caracteres cada uno).';
      return false;
    }
    this.error = '';
    return true;
  }

  guardar(): void {
    if (this.guardando) { return; }
    this.guardando = true;
    this.error = '';
    this.api.put<Atencion>(`atencion/cita/${this.citaId}`, this.form).subscribe({
      next: (a) => { this.atencion = a; this.guardando = false; Swal.fire({ icon: 'success', title: 'Borrador guardado', timer: 1200, showConfirmButton: false }); },
      error: (e) => { this.guardando = false; this.error = obtenerMensajeError(e, 'No fue posible guardar.'); }
    });
  }

  finalizar(): void {
    if (this.guardando || !this.valido()) { return; }
    Swal.fire({
      icon: 'question', title: '¿Finalizar la atención?', text: 'La cita pasará a ATENDIDA y se registrará en el historial clínico. Después no podrás modificarla.',
      showCancelButton: true, confirmButtonText: 'Finalizar', cancelButtonText: 'Volver'
    }).then((r) => {
      if (!r.isConfirmed) { return; }
      this.guardando = true;
      this.api.post<Atencion>(`atencion/cita/${this.citaId}/finalizar`, this.form).subscribe({
        next: (a) => { this.atencion = a; this.guardando = false; Swal.fire({ icon: 'success', title: 'Atención finalizada y registrada en el historial', timer: 2000, showConfirmButton: false }); },
        error: (e) => { this.guardando = false; this.error = obtenerMensajeError(e, 'No fue posible finalizar la atención.'); }
      });
    });
  }

  generarFormula(): void {
    this.router.navigate(['/inicio/formulas'], { queryParams: { citaId: this.citaId } });
  }

  get serviciosFiltrados(): Servicio[] {
    const q = this.filtroServicio.trim().toLowerCase();
    return this.servicios.filter((s) => !q || `${s.codigo} ${s.nombre} ${s.categoria}`.toLowerCase().includes(q));
  }

  cambiarCantidad(id: number, valor: number): void {
    if (!valor || valor <= 0) { delete this.cantidades[id]; } else { this.cantidades[id] = Math.min(99, Math.floor(valor)); }
  }

  /** Prefactura en PDF: servicios prestados y medicamentos formulados. */
  prefactura(): void {
    const servicios = Object.entries(this.cantidades).map(([id, cantidad]) => ({ servicioId: Number(id), cantidad }));
    this.api.abrirPdfPost('factura/prefactura/pdf', { citaId: this.citaId, servicios, incluirFormulas: true })
      .catch((e) => Swal.fire('No se pudo generar la prefactura', obtenerMensajeError(e, 'Selecciona al menos un servicio o formula medicamentos.'), 'warning'));
  }

  volver(): void {
    this.router.navigate(['/inicio/agenda']);
  }
}
