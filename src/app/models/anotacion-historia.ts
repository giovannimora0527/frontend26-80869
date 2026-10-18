/** Fila del listado de anotaciones (`GET /anotacion-historia/paginado`). */
export interface AnotacionResumen {
  id: number;
  historiaId: number;
  fecha: string;
  medicoNombre: string;
  descripcion: string;
  diagnostico: string;
}

/** Cuerpo para agregar una anotación (las anotaciones no se editan ni se borran). */
export interface AnotacionRq {
  historiaId: number;
  medicoId: number;
  descripcion: string;
  observacion: string;
  diagnostico: string;
}

/** Filtros del histórico de anotaciones de una historia. */
export interface AnotacionFiltro {
  texto?: string;
  historiaId?: number | null;
  medicoId?: number | null;
  fechaDesde?: string;
  fechaHasta?: string;
}
