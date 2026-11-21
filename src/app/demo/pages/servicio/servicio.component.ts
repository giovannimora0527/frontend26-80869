import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

import { ApiService } from 'src/app/services/api.service';
import { obtenerMensajeError } from 'src/app/utils/mensajes-error';
import { Servicio, Tarifa } from 'src/app/models/clinica-extra';

const CATEGORIAS = ['CONSULTA', 'VACUNACION', 'PROCEDIMIENTO', 'CIRUGIA', 'DIAGNOSTICO', 'ESTETICA', 'HOSPITALIZACION'];

/**
 * Catálogo de servicios y gestión de tarifas. Cada cambio de precio exige un motivo y queda en el
 * historial (log de tarifas). Los servicios no se borran: se activan o inactivan.
 */
@Component({
  selector: 'app-servicio',
  imports: [CommonModule, FormsModule],
  templateUrl: './servicio.component.html'
})
export class ServicioComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly categorias = CATEGORIAS;

  servicios: Servicio[] = [];
  especializaciones: { id: number; nombre: string }[] = [];
  texto = '';
  categoria = '';
  estado: 'todos' | 'activos' | 'inactivos' = 'todos';
  cargando = false;
  error = '';

  mostrarForm = false;
  editandoId: number | null = null;
  precioOriginal = 0;
  enviando = false;
  errorForm = '';
  form = this.vacio();

  historial: { servicio: Servicio; tarifas: Tarifa[] } | null = null;

  readonly rol: number = (() => {
    try { return JSON.parse(localStorage.getItem('usuario') || '{}').rol ?? 0; } catch { return 0; }
  })();
  /** Solo el administrador y el contable administran tarifas, especialidades e impuestos. */
  readonly puedeEditar = this.rol === 1 || this.rol === 6;

  pestana: 'servicios' | 'especialidades' | 'impuestos' = 'servicios';

  // ---- especialidades
  especialidades: { id: number; nombre: string; descripcion?: string; codigo: string; activo: boolean; medicos: number; servicios: number }[] = [];
  mostrarEsp = false;
  espId: number | null = null;
  espForm = { nombre: '', descripcion: '', codigo: '' };
  errorEsp = '';

  // ---- impuestos y datos de la clínica
  clinica = { nombre: '', nit: '', direccion: '', telefono: '', email: '', ivaPorcentaje: 19 as number | null };
  errorClinica = '';

  ngOnInit(): void {
    this.cargar();
    this.cargarEspecialidades();
  }

  cambiarPestana(p: 'servicios' | 'especialidades' | 'impuestos'): void {
    this.pestana = p;
    if (p === 'impuestos') { this.cargarClinica(); }
    if (p === 'especialidades') { this.cargarEspecialidades(); }
  }

  cargarEspecialidades(): void {
    this.api.get<typeof this.especialidades>('especialidad/listar').subscribe({
      next: (e) => { this.especialidades = e; this.especializaciones = e.filter((x) => x.activo).map((x) => ({ id: x.id, nombre: x.nombre })); },
      error: (e) => (this.error = obtenerMensajeError(e, 'No fue posible cargar las especialidades.'))
    });
  }

  nuevaEsp(): void {
    this.espId = null; this.espForm = { nombre: '', descripcion: '', codigo: '' }; this.errorEsp = ''; this.mostrarEsp = true;
  }

  editarEsp(e: { id: number; nombre: string; descripcion?: string; codigo: string }): void {
    this.espId = e.id; this.espForm = { nombre: e.nombre, descripcion: e.descripcion ?? '', codigo: e.codigo }; this.errorEsp = ''; this.mostrarEsp = true;
  }

  guardarEsp(): void {
    const f = this.espForm;
    if (!f.nombre.trim() || !/^[A-Za-z0-9]{2,10}$/.test(f.codigo.trim())) {
      this.errorEsp = 'Indica el nombre y un código de 2 a 10 letras o números.';
      return;
    }
    const p = this.espId === null
      ? this.api.post<{ message: string }>('especialidad/crear', f)
      : this.api.put<{ message: string }>(`especialidad/${this.espId}`, f);
    p.subscribe({
      next: (r) => { this.mostrarEsp = false; Swal.fire({ icon: 'success', title: r.message, timer: 1800, showConfirmButton: false }); this.cargarEspecialidades(); },
      error: (e) => (this.errorEsp = obtenerMensajeError(e, 'No fue posible guardar la especialidad.'))
    });
  }

  alternarEsp(e: { id: number; activo: boolean }): void {
    this.api.patch(`especialidad/${e.id}/estado`, { activo: !e.activo }).subscribe({
      next: () => this.cargarEspecialidades(),
      error: (er) => Swal.fire('Error', obtenerMensajeError(er, 'No fue posible cambiar el estado.'), 'error')
    });
  }

  cargarClinica(): void {
    this.api.get<typeof this.clinica>('factura/datos-clinica').subscribe({
      next: (c) => (this.clinica = { ...this.clinica, ...c }),
      error: (e) => (this.errorClinica = obtenerMensajeError(e, 'No fue posible cargar los datos de la clínica.'))
    });
  }

  guardarClinica(): void {
    const c = this.clinica;
    if (!c.nombre.trim() || !c.nit.trim() || c.ivaPorcentaje === null || c.ivaPorcentaje < 0 || c.ivaPorcentaje > 100) {
      this.errorClinica = 'Indica nombre, NIT y un IVA entre 0 y 100.';
      return;
    }
    this.errorClinica = '';
    this.api.put<unknown>('factura/datos-clinica', c).subscribe({
      next: () => Swal.fire({ icon: 'success', title: 'Datos e IVA actualizados. Se aplican a las facturas nuevas.', timer: 2200, showConfirmButton: false }),
      error: (e) => (this.errorClinica = obtenerMensajeError(e, 'No fue posible guardar.'))
    });
  }

  private vacio() {
    return {
      codigo: '', nombre: '', descripcion: '', categoria: 'CONSULTA', especializacionId: null as number | null,
      requiereEspecializacion: false, precio: null as number | null, aplicaIva: true, motivoTarifa: ''
    };
  }

  cargar(): void {
    this.cargando = true;
    this.api.get<Servicio[]>('servicio/listar').subscribe({
      next: (s) => { this.servicios = s; this.cargando = false; },
      error: (e) => { this.error = obtenerMensajeError(e, 'No fue posible cargar los servicios.'); this.cargando = false; }
    });
  }

  get filtrados(): Servicio[] {
    const q = this.texto.trim().toLowerCase();
    return this.servicios.filter((s) =>
      (!q || `${s.codigo} ${s.nombre} ${s.descripcion ?? ''}`.toLowerCase().includes(q)) &&
      (!this.categoria || s.categoria === this.categoria) &&
      (this.estado === 'todos' || (this.estado === 'activos') === s.activo));
  }

  nuevo(): void {
    this.editandoId = null;
    this.form = this.vacio();
    this.errorForm = '';
    this.mostrarForm = true;
  }

  editar(s: Servicio): void {
    this.editandoId = s.id;
    this.precioOriginal = s.precio;
    this.form = {
      codigo: s.codigo, nombre: s.nombre, descripcion: s.descripcion ?? '', categoria: s.categoria,
      especializacionId: s.especializacionId ?? null, requiereEspecializacion: s.requiereEspecializacion,
      precio: s.precio, aplicaIva: s.aplicaIva, motivoTarifa: ''
    };
    this.errorForm = '';
    this.mostrarForm = true;
  }

  get cambiaPrecio(): boolean {
    return this.editandoId !== null && this.form.precio !== null && Number(this.form.precio) !== Number(this.precioOriginal);
  }

  guardar(): void {
    if (this.enviando) { return; }
    const f = this.form;
    if ((this.editandoId === null && !f.codigo.trim()) || !f.nombre.trim() || f.precio === null || f.precio <= 0) {
      this.errorForm = 'Completa código, nombre y un precio mayor a cero.';
      return;
    }
    if (f.requiereEspecializacion && !f.especializacionId) {
      this.errorForm = 'Si el servicio requiere especialización, selecciona cuál.';
      return;
    }
    if (this.cambiaPrecio && f.motivoTarifa.trim().length < 5) {
      this.errorForm = 'Indica el motivo del cambio de tarifa (mínimo 5 caracteres).';
      return;
    }
    this.enviando = true;
    this.errorForm = '';
    const peticion = this.editandoId === null
      ? this.api.post<{ message: string }>('servicio/crear', f)
      : this.api.put<{ message: string }>(`servicio/${this.editandoId}`, f);
    peticion.subscribe({
      next: (r) => { this.enviando = false; this.mostrarForm = false; Swal.fire({ icon: 'success', title: r.message, timer: 2000, showConfirmButton: false }); this.cargar(); },
      error: (e) => { this.enviando = false; this.errorForm = obtenerMensajeError(e, 'No fue posible guardar el servicio.'); }
    });
  }

  alternar(s: Servicio): void {
    this.api.patch(`servicio/${s.id}/estado`, { activo: !s.activo }).subscribe({
      next: () => this.cargar(),
      error: (e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible cambiar el estado.'), 'error')
    });
  }

  verHistorial(s: Servicio): void {
    this.api.get<Tarifa[]>(`servicio/${s.id}/tarifas`).subscribe({
      next: (t) => (this.historial = { servicio: s, tarifas: t }),
      error: (e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible cargar el historial.'), 'error')
    });
  }
}
