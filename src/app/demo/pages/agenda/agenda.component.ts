import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { ApiService } from 'src/app/services/api.service';
import { obtenerMensajeError } from 'src/app/utils/mensajes-error';
import { fechaLocalISO } from 'src/app/utils/validadores';

interface CitaAgenda {
  id: number; fechaHora: string; estado: string; motivo?: string; duracionMinutos?: number;
  cliente?: { id: number; nombres: string; apellidos: string };
  mascota?: { mascotaId: number; nombreMascota: string };
  medico?: { id: number; nombres: string; apellidos: string; usuarioId?: number };
}
interface Dia { fecha: string; numero: number; delMes: boolean; hoy: boolean; citas: CitaAgenda[]; }
interface Horario { id: number; diaSemana: number; horaInicio: string; horaFin: string; activo: boolean; }
type Vista = 'mes' | 'semana' | 'dia';

const ROL_MEDICO = 3;

/**
 * Calendario del veterinario (perfil Médico). Vistas de mes, semana y día; citas coloreadas por estado con su
 * hora de inicio y finalización; registrar y editar citas, reprogramar (el backend valida cruces de agenda y el
 * horario de disponibilidad), pasar a la atención médica, ver el historial de citas de una mascota, gestionar el
 * horario de disponibilidad y bajar el informe Excel con filtro de fechas. Se refresca solo cada minuto.
 */
@Component({
  selector: 'app-agenda',
  imports: [CommonModule, FormsModule],
  templateUrl: './agenda.component.html'
})
export class AgendaComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly usuario: { id: number; rol: number } = (() => {
    try { return JSON.parse(localStorage.getItem('usuario') || '{}'); } catch { return { id: 0, rol: 0 }; }
  })();
  readonly esMedico = this.usuario.rol === ROL_MEDICO;
  readonly colores: Record<string, string> = { PROGRAMADA: 'primary', PENDIENTE: 'primary', CONFIRMADA: 'info', ATENDIDA: 'success', CANCELADA: 'secondary' };
  readonly diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  readonly nombresDia = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  vista: Vista = 'mes';
  referencia = new Date();
  citas: CitaAgenda[] = [];
  dias: Dia[] = [];
  semana: Dia[] = [];
  seleccionado = fechaLocalISO();
  filtroEstado = '';
  cargando = false;
  error = '';
  ultimaActualizacion = '';
  miMedicoId: number | null = null;
  private temporizador: ReturnType<typeof setInterval> | null = null;

  // ---- nueva / editar cita
  mostrarCita = false;
  editando: CitaAgenda | null = null;
  clientes: { id: number; nombres: string; apellidos: string; numeroDocumento: string }[] = [];
  mascotas: { mascotaId: number; nombreMascota: string }[] = [];
  medicos: { id: number; nombres: string; apellidos: string; estado: boolean; usuarioId?: number }[] = [];
  form = { clienteId: null as number | null, mascotaId: null as number | null, medicoId: null as number | null, fechaHora: '', motivo: '' };
  errorCita = '';
  enviando = false;

  // ---- historial de la mascota
  historial: { mascota: string; citas: CitaAgenda[] } | null = null;

  // ---- horarios
  mostrarHorarios = false;
  horarios: Horario[] = [];
  horarioNuevo = { diaSemana: 1, horaInicio: '08:00', horaFin: '12:00' };
  errorHorario = '';

  // ---- informe
  informeDesde = fechaLocalISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  informeHasta = fechaLocalISO();
  mostrarInforme = false;

  ngOnInit(): void {
    this.cargarMedicos();
    this.cargar();
    this.temporizador = setInterval(() => this.cargar(true), 60000);
  }

  ngOnDestroy(): void {
    if (this.temporizador) { clearInterval(this.temporizador); }
  }

  // ====================================================================== navegación

  get titulo(): string {
    if (this.vista === 'mes') { return this.referencia.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }); }
    if (this.vista === 'dia') { return this.referencia.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
    const ini = this.lunesDe(this.referencia);
    const fin = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + 6);
    return `Semana del ${ini.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })} al ${fin.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }

  cambiarVista(v: Vista): void {
    this.vista = v;
    this.cargar();
  }

  mover(delta: number): void {
    const r = this.referencia;
    if (this.vista === 'mes') { this.referencia = new Date(r.getFullYear(), r.getMonth() + delta, 1); }
    else if (this.vista === 'semana') { this.referencia = new Date(r.getFullYear(), r.getMonth(), r.getDate() + 7 * delta); }
    else { this.referencia = new Date(r.getFullYear(), r.getMonth(), r.getDate() + delta); }
    this.seleccionado = fechaLocalISO(this.referencia);
    this.cargar();
  }

  irAHoy(): void {
    this.referencia = new Date();
    this.seleccionado = fechaLocalISO();
    this.cargar();
  }

  private lunesDe(f: Date): Date {
    const desfase = (f.getDay() + 6) % 7;
    return new Date(f.getFullYear(), f.getMonth(), f.getDate() - desfase);
  }

  // ====================================================================== datos

  cargar(silencioso = false): void {
    if (!silencioso) { this.cargando = true; }
    // Siempre se trae el mes de la fecha de referencia con holgura de 7 días (cubre las tres vistas).
    const inicio = new Date(this.referencia.getFullYear(), this.referencia.getMonth(), 1 - 7);
    const fin = new Date(this.referencia.getFullYear(), this.referencia.getMonth() + 1, 7);
    this.api.get<CitaAgenda[]>('cita/listar-rango', { fechaInicio: `${fechaLocalISO(inicio)}T00:00:00`, fechaFin: `${fechaLocalISO(fin)}T23:59:59` }).subscribe({
      next: (c) => {
        this.citas = this.esMedico ? c.filter((x) => x.medico?.usuarioId === this.usuario.id) : c;
        this.armar();
        this.cargando = false;
        this.error = '';
        this.ultimaActualizacion = new Date().toLocaleTimeString('es-CO');
      },
      error: (e) => { this.cargando = false; this.error = obtenerMensajeError(e, 'No fue posible cargar la agenda.'); }
    });
  }

  private cargarMedicos(): void {
    this.api.get<typeof this.medicos>('medico/listar').subscribe({
      next: (m) => {
        this.medicos = m.filter((x) => x.estado);
        const mio = m.find((x) => x.usuarioId === this.usuario.id);
        this.miMedicoId = mio ? mio.id : null;
      }
    });
  }

  private armar(): void {
    const mes = this.referencia.getMonth();
    const primero = new Date(this.referencia.getFullYear(), mes, 1);
    const inicio = new Date(primero.getFullYear(), primero.getMonth(), 1 - ((primero.getDay() + 6) % 7));
    const hoy = fechaLocalISO();
    this.dias = [];
    for (let i = 0; i < 42; i++) {
      this.dias.push(this.dia(new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i), mes, hoy));
    }
    const lunes = this.lunesDe(this.referencia);
    this.semana = [];
    for (let i = 0; i < 7; i++) {
      this.semana.push(this.dia(new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i), mes, hoy));
    }
  }

  private dia(d: Date, mes: number, hoy: string): Dia {
    const fecha = fechaLocalISO(d);
    return { fecha, numero: d.getDate(), delMes: d.getMonth() === mes, hoy: fecha === hoy, citas: this.citasDe(fecha) };
  }

  private citasDe(fecha: string): CitaAgenda[] {
    return this.citas.filter((c) => c.fechaHora.startsWith(fecha) && (!this.filtroEstado || c.estado === this.filtroEstado))
      .sort((a, b) => (a.fechaHora < b.fechaHora ? -1 : 1));
  }

  get citasDelDia(): CitaAgenda[] {
    return this.citasDe(this.seleccionado);
  }

  seleccionar(d: Dia): void {
    this.seleccionado = d.fecha;
  }

  abrirDia(d: Dia): void {
    this.referencia = new Date(d.fecha + 'T00:00:00');
    this.seleccionado = d.fecha;
    this.vista = 'dia';
    this.armar();
  }

  filtrar(): void {
    this.armar();
  }

  hora(c: CitaAgenda): string {
    return c.fechaHora.substring(11, 16);
  }

  /** Hora de finalización = inicio + duración (30 minutos por defecto). */
  horaFin(c: CitaAgenda): string {
    const d = new Date(c.fechaHora);
    d.setMinutes(d.getMinutes() + (c.duracionMinutos ?? 30));
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  // ====================================================================== acciones sobre la cita

  cambiarEstado(c: CitaAgenda, estado: string): void {
    this.api.patch(`cita/${c.id}/estado`, { estado }).subscribe({
      next: () => this.cargar(true),
      error: (e) => Swal.fire('No se pudo cambiar el estado', obtenerMensajeError(e, 'No fue posible cambiar el estado.'), 'error')
    });
  }

  atender(c: CitaAgenda): void {
    this.router.navigate(['/inicio/atencion', c.id]);
  }

  nueva(): void {
    this.editando = null;
    this.errorCita = '';
    this.form = { clienteId: null, mascotaId: null, medicoId: this.esMedico ? this.miMedicoId : null, fechaHora: '', motivo: '' };
    this.mascotas = [];
    this.api.get<typeof this.clientes>('cliente/listar-activos').subscribe({ next: (c) => (this.clientes = c) });
    this.mostrarCita = true;
  }

  editar(c: CitaAgenda): void {
    this.editando = c;
    this.errorCita = '';
    this.form = { clienteId: c.cliente?.id ?? null, mascotaId: c.mascota?.mascotaId ?? null, medicoId: c.medico?.id ?? null, fechaHora: c.fechaHora.substring(0, 16), motivo: c.motivo ?? '' };
    this.clientes = c.cliente ? [{ id: c.cliente.id, nombres: c.cliente.nombres, apellidos: c.cliente.apellidos, numeroDocumento: '' }] : [];
    this.mascotas = c.mascota ? [{ mascotaId: c.mascota.mascotaId, nombreMascota: c.mascota.nombreMascota }] : [];
    this.mostrarCita = true;
  }

  alCambiarCliente(): void {
    this.form.mascotaId = null;
    this.mascotas = [];
    if (this.form.clienteId) {
      this.api.get<typeof this.mascotas>('mascota/buscar-by-cliente', { clienteId: this.form.clienteId }).subscribe({ next: (m) => (this.mascotas = m) });
    }
  }

  guardarCita(): void {
    if (this.enviando) { return; }
    const f = this.form;
    if (!f.clienteId || !f.mascotaId || !f.medicoId || !f.fechaHora || f.motivo.trim().length < 3) {
      this.errorCita = 'Selecciona propietario, mascota y veterinario, e indica fecha, hora y un motivo.';
      return;
    }
    this.enviando = true;
    this.errorCita = '';
    const cuerpo = { clienteId: f.clienteId, mascotaId: f.mascotaId, medicoId: f.medicoId, fechaHora: f.fechaHora.length === 16 ? f.fechaHora + ':00' : f.fechaHora, motivo: f.motivo.trim() };
    const p = this.editando
      ? this.api.put<unknown>(`cita/${this.editando.id}`, { ...cuerpo, id: this.editando.id, estado: this.editando.estado })
      : this.api.post<unknown>('cita/crear', cuerpo);
    p.subscribe({
      next: () => { this.enviando = false; this.mostrarCita = false; this.cargar(true); Swal.fire({ icon: 'success', title: this.editando ? 'Cita actualizada' : 'Cita registrada', timer: 1500, showConfirmButton: false }); },
      error: (e) => { this.enviando = false; this.errorCita = obtenerMensajeError(e, 'No fue posible guardar la cita.'); }
    });
  }

  verHistorial(c: CitaAgenda): void {
    if (!c.mascota) { return; }
    this.api.get<CitaAgenda[]>('cita/listar-por-mascota', { mascotaId: c.mascota.mascotaId }).subscribe({
      next: (l) => (this.historial = { mascota: c.mascota!.nombreMascota, citas: l }),
      error: (e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible cargar el historial.'), 'error')
    });
  }

  // ====================================================================== horarios

  abrirHorarios(): void {
    if (!this.miMedicoId) { Swal.fire('Sin veterinario asociado', 'Tu usuario no está asociado a un veterinario. Pide al administrador que lo asocie.', 'info'); return; }
    this.mostrarHorarios = true;
    this.cargarHorarios();
  }

  cargarHorarios(): void {
    this.api.get<Horario[]>(`horario-medico/${this.miMedicoId}`).subscribe({ next: (h) => (this.horarios = h.filter((x) => x.activo)) });
  }

  agregarHorario(): void {
    this.errorHorario = '';
    this.api.post(`horario-medico/${this.miMedicoId}`, this.horarioNuevo).subscribe({
      next: () => this.cargarHorarios(),
      error: (e) => (this.errorHorario = obtenerMensajeError(e, 'No fue posible agregar la franja.'))
    });
  }

  quitarHorario(h: Horario): void {
    this.api.patch(`horario-medico/${this.miMedicoId}/${h.id}/desactivar`).subscribe({ next: () => this.cargarHorarios() });
  }

  // ====================================================================== informe

  descargarInforme(): void {
    if (this.informeDesde > this.informeHasta) { Swal.fire('Fechas no válidas', 'La fecha inicial no puede ser posterior a la final.', 'warning'); return; }
    this.api.descargar('reporte/citas', `citas_medico_${this.informeDesde}_${this.informeHasta}.xlsx`, { desde: this.informeDesde, hasta: this.informeHasta, formato: 'xlsx', estado: '' })
      .then(() => (this.mostrarInforme = false))
      .catch((e) => Swal.fire('Error', obtenerMensajeError(e, 'No fue posible descargar el informe.'), 'error'));
  }
}
