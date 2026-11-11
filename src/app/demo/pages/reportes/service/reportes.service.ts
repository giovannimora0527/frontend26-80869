import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';

/**
 * Estructura generica de un reporte, identica a la que devuelve el backend
 * (ReporteRs). El mismo contrato se usa para pintar la vista previa y para las
 * exportaciones a PDF y Excel.
 */
export interface Reporte {
  titulo: string;
  subtitulo: string;
  columnas: string[];
  filas: string[][];
  totales: { [etiqueta: string]: string };
}

/**
 * Servicio del modulo de reportes. Consume el modulo /reporte del backend, que
 * esta restringido a los perfiles Administrador, Contable y JEFE_BODEGA.
 *
 * Las exportaciones (PDF y Excel) se obtienen como Blob para descargarlas o
 * abrirlas en el navegador.
 */
@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private readonly base = `${environment.apiUrlAuth}/reporte`;

  constructor(private http: HttpClient) {}

  private params(categoria: string, tipo: string, desde: string, hasta: string): HttpParams {
    return new HttpParams()
      .set('categoria', categoria)
      .set('tipo', tipo)
      .set('desde', desde)
      .set('hasta', hasta);
  }

  generar(categoria: string, tipo: string, desde: string, hasta: string): Observable<Reporte> {
    return this.http.get<Reporte>(`${this.base}/generar`, {
      params: this.params(categoria, tipo, desde, hasta)
    });
  }

  descargarPdf(categoria: string, tipo: string, desde: string, hasta: string): Observable<Blob> {
    return this.http.get(`${this.base}/pdf`, {
      params: this.params(categoria, tipo, desde, hasta),
      responseType: 'blob'
    });
  }

  descargarExcel(categoria: string, tipo: string, desde: string, hasta: string): Observable<Blob> {
    return this.http.get(`${this.base}/excel`, {
      params: this.params(categoria, tipo, desde, hasta),
      responseType: 'blob'
    });
  }
}
