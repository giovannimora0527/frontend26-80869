import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CitaService, Cita } from '../../../services/cita.service';

/**
 * Componente que muestra el listado de citas médicas en un DataTable.
 * Implementa paginación, filtros, ordenamiento y acciones CRUD.
 */
@Component({
  selector: 'app-cita-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cita-list.component.html',
  styleUrls: ['./cita-list.component.scss']
})
export class CitaListComponent implements OnInit {

  citas: Cita[] = [];
  citasFiltradas: Cita[] = [];
  cargando = true;
  mensajeError = '';
  mensajeExito = '';
  textoBusqueda = '';
  paginaActual = 1;
  elementosPorPagina = 10;

  constructor(
    private citaService: CitaService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarCitas();
  }

  /**
   * Carga todas las citas desde el backend.
   */
  cargarCitas(): void {
    this.cargando = true;
    this.mensajeError = '';
    
    this.citaService.getCitas().subscribe({
      next: (data) => {
        this.citas = data;
        this.citasFiltradas = [...this.citas];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar citas:', err);
        this.mensajeError = 'Error al conectar con el servidor';
        this.cargando = false;
      }
    });
  }

  /**
   * Filtra las citas por texto de búsqueda.
   */
  filtrarCitas(): void {
    if (!this.textoBusqueda || this.textoBusqueda.trim() === '') {
      this.citasFiltradas = [...this.citas];
    } else {
      const texto = this.textoBusqueda.toLowerCase();
      this.citasFiltradas = this.citas.filter(c =>
        this.getNombreCliente(c).toLowerCase().includes(texto) ||
        this.getNombreMascota(c).toLowerCase().includes(texto) ||
        this.getNombreVeterinario(c).toLowerCase().includes(texto) ||
        c.motivo.toLowerCase().includes(texto) ||
        c.estado.toLowerCase().includes(texto)
      );
    }
    this.paginaActual = 1;
  }

  /**
   * Ordena las citas por la columna seleccionada.
   */
  ordenarPor(campo: string): void {
    this.citasFiltradas.sort((a, b) => {
      let valorA: any = '';
      let valorB: any = '';

      if (campo === 'fechaHora') {
        valorA = a.fechaHora;
        valorB = b.fechaHora;
      } else if (campo === 'estado') {
        valorA = a.estado;
        valorB = b.estado;
      }

      if (valorA < valorB) return -1;
      if (valorA > valorB) return 1;
      return 0;
    });
  }

  getCitasPaginadas(): Cita[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.citasFiltradas.slice(inicio, fin);
  }

  get totalPaginas(): number {
    return Math.ceil(this.citasFiltradas.length / this.elementosPorPagina);
  }

  get paginasArray(): number[] {
    const paginas: number[] = [];
    for (let i = 1; i <= this.totalPaginas; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }

  irAPagina(pagina: number): void {
    this.paginaActual = pagina;
  }

  crearNuevaCita(): void {
    this.router.navigate(['/cita/nuevo']);
  }

  editarCita(id: number): void {
    this.router.navigate(['/cita/editar', id]);
  }

  verCita(id: number): void {
    this.router.navigate(['/cita/ver', id]);
  }

  confirmarEliminacion(id: number): void {
    if (confirm('¿Está seguro de cancelar esta cita?')) {
      this.eliminarCita(id);
    }
  }

  eliminarCita(id: number): void {
    this.citaService.deleteCita(id).subscribe({
      next: () => {
        this.mensajeExito = 'Cita cancelada correctamente';
        this.cargarCitas();
      },
      error: (err) => {
        console.error('Error al cancelar cita:', err);
        this.mensajeError = 'Error al cancelar la cita';
      }
    });
  }

  getNombreCliente(cita: Cita): string {
    return `${cita.cliente?.nombres || ''} ${cita.cliente?.apellidos || ''}`.trim();
  }

  getNombreMascota(cita: Cita): string {
    return cita.mascota?.nombreMascota || 'Sin mascota';
  }

  getNombreVeterinario(cita: Cita): string {
    return `Dr(a). ${cita.medico?.nombres || ''} ${cita.medico?.apellidos || ''}`.trim();
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'bg-warning text-dark';
      case 'Confirmada': return 'bg-info text-dark';
      case 'Atendida': return 'bg-success';
      case 'Cancelada': return 'bg-danger';
      case 'Programada': return 'bg-primary';
      default: return 'bg-secondary';
    }
  }
}