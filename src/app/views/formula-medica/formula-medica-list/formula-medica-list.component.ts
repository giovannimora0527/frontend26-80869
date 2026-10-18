import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormulaMedicaService, FormulaMedica } from '../../../services/formula-medica.service';

/**
 * Componente que muestra el listado de fórmulas médicas en un DataTable.
 * Implementa paginación, filtros, ordenamiento y acciones CRUD.
 */
@Component({
  selector: 'app-formula-medica-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formula-medica-list.component.html',
  styleUrls: ['./formula-medica-list.component.scss']
})
export class FormulaMedicaListComponent implements OnInit {

  formulas: FormulaMedica[] = [];
  formulasFiltradas: FormulaMedica[] = [];
  cargando = true;
  mensajeError = '';
  mensajeExito = '';
  textoBusqueda = '';
  paginaActual = 1;
  elementosPorPagina = 10;

  constructor(
    private formulaService: FormulaMedicaService,
    private router: Router
  ) { }

  /**
   * Inicializa el componente y carga las fórmulas médicas.
   */
  ngOnInit(): void {
    this.cargarFormulas();
  }

  /**
   * Carga todas las fórmulas médicas desde el backend.
   * Muestra mensaje de error si falla la conexión.
   */
  cargarFormulas(): void {
    this.cargando = true;
    this.mensajeError = '';
    
    this.formulaService.getFormulas().subscribe({
      next: (data: FormulaMedica[]) => {
        this.formulas = data;
        this.formulasFiltradas = [...this.formulas];
        this.cargando = false;
        console.log('✅ Fórmulas cargadas:', this.formulas.length);
      },
      error: (err) => {
        console.error('❌ Error al cargar fórmulas:', err);
        this.mensajeError = 'Error al conectar con el servidor. Verifique que el backend esté corriendo.';
        this.cargando = false;
      }
    });
  }

  /**
   * Filtra las fórmulas por texto de búsqueda.
   */
  filtrarFormulas(): void {
    if (!this.textoBusqueda || this.textoBusqueda.trim() === '') {
      this.formulasFiltradas = [...this.formulas];
    } else {
      const texto = this.textoBusqueda.toLowerCase();
      this.formulasFiltradas = this.formulas.filter(f =>
        this.getNombreMascota(f).toLowerCase().includes(texto) ||
        this.getNombreCliente(f).toLowerCase().includes(texto) ||
        this.getNombreMedicamento(f).toLowerCase().includes(texto) ||
        this.getNombreVeterinario(f).toLowerCase().includes(texto) ||
        (f.dosis && f.dosis.toLowerCase().includes(texto)) ||
        (f.indicaciones && f.indicaciones.toLowerCase().includes(texto))
      );
    }
    this.paginaActual = 1;
  }

  /**
   * Ordena las fórmulas por la columna seleccionada.
   */
  ordenarPor(campo: string): void {
    this.formulasFiltradas.sort((a, b) => {
      let valorA: any = '';
      let valorB: any = '';

      if (campo === 'id') {
        valorA = a.id;
        valorB = b.id;
      } else if (campo === 'medicamento') {
        valorA = this.getNombreMedicamento(a);
        valorB = this.getNombreMedicamento(b);
      } else if (campo === 'fechaCreacionRegistro') {
        valorA = a.fechaCreacionRegistro;
        valorB = b.fechaCreacionRegistro;
      }

      if (valorA < valorB) return -1;
      if (valorA > valorB) return 1;
      return 0;
    });
  }

  /**
   * Obtiene las fórmulas de la página actual.
   */
  getFormulasPaginadas(): FormulaMedica[] {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    return this.formulasFiltradas.slice(inicio, fin);
  }

  /**
   * Calcula el total de páginas.
   */
  get totalPaginas(): number {
    return Math.ceil(this.formulasFiltradas.length / this.elementosPorPagina);
  }

  /**
   * Genera array de páginas para la paginación.
   */
  get paginasArray(): number[] {
    const paginas: number[] = [];
    for (let i = 1; i <= this.totalPaginas; i++) {
      paginas.push(i);
    }
    return paginas;
  }

  /**
   * Navegación de paginación.
   */
  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  irAPagina(pagina: number): void {
    this.paginaActual = pagina;
  }

  /**
   * Acciones CRUD.
   */
  crearNuevaFormula(): void {
    this.router.navigate(['/formula-medica/nuevo']);
  }

  editarFormula(id: number): void {
    this.router.navigate(['/formula-medica/editar', id]);
  }

  verFormula(id: number): void {
    this.router.navigate(['/formula-medica/ver', id]);
  }

  confirmarEliminacion(id: number): void {
    if (confirm('¿Está seguro de eliminar esta fórmula médica? Esta acción no se puede deshacer.')) {
      this.eliminarFormula(id);
    }
  }

  eliminarFormula(id: number): void {
    this.formulaService.deleteFormula(id).subscribe({
      next: () => {
        this.mensajeExito = 'Fórmula médica eliminada correctamente';
        this.cargarFormulas();
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        this.mensajeError = 'Error al eliminar la fórmula médica';
      }
    });
  }

  /**
   * Helpers para obtener datos de entidades relacionadas.
   */
  getNombreMascota(formula: FormulaMedica): string {
    return formula?.cita?.mascota?.nombreMascota || 
           formula?.cita?.mascota?.nombre || 
           'Sin mascota';
  }

  getNombreCliente(formula: FormulaMedica): string {
    const cliente = formula?.cita?.mascota?.cliente;
    if (!cliente) return 'Sin cliente';
    return `${cliente.nombres || ''} ${cliente.apellidos || ''}`.trim() || 'Sin cliente';
  }

  getNombreMedicamento(formula: FormulaMedica): string {
    return formula?.medicamento?.nombre || 
           formula?.medicamento?.descripcion?.substring(0, 30) || 
           'Sin medicamento';
  }

  getNombreVeterinario(formula: FormulaMedica): string {
    const medico = formula?.cita?.medico || (formula as any)?.medico;
    if (!medico) return 'Sin veterinario';
    return `Dr(a). ${medico.nombres || ''} ${medico.apellidos || ''}`.trim();
  }

  /**
   * Formatea la fecha para mostrarla en español.
   */
  formatearFecha(fecha: string | Date): string {
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
}