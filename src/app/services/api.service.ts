import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/**
 * Cliente HTTP de los módulos del segundo parcial. Agrega el token JWT y ofrece las operaciones
 * que el BackendService genérico no cubre: descarga de archivos (PDF, Excel, CSV) y subida de archivos.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private headers(json = true): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    let h = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    if (json) {
      h = h.set('Content-Type', 'application/json');
    }
    return h;
  }

  /** Convierte un objeto en parámetros de URL ignorando vacíos. */
  private params(obj?: Record<string, unknown>): HttpParams {
    let p = new HttpParams();
    Object.entries(obj ?? {}).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        p = p.set(k, String(v));
      }
    });
    return p;
  }

  get<T>(ruta: string, params?: Record<string, unknown>): Observable<T> {
    return this.http.get<T>(`${environment.apiUrlAuth}/${ruta}`, { headers: this.headers(), params: this.params(params) });
  }

  post<T>(ruta: string, cuerpo: unknown = {}): Observable<T> {
    return this.http.post<T>(`${environment.apiUrlAuth}/${ruta}`, cuerpo, { headers: this.headers() });
  }

  put<T>(ruta: string, cuerpo: unknown): Observable<T> {
    return this.http.put<T>(`${environment.apiUrlAuth}/${ruta}`, cuerpo, { headers: this.headers() });
  }

  patch<T>(ruta: string, cuerpo: unknown = {}): Observable<T> {
    return this.http.patch<T>(`${environment.apiUrlAuth}/${ruta}`, cuerpo, { headers: this.headers() });
  }

  /** Sube un archivo como multipart/form-data (el navegador pone el boundary). */
  subir<T>(ruta: string, campo: string, archivo: File): Observable<T> {
    const datos = new FormData();
    datos.append(campo, archivo, archivo.name);
    return this.http.post<T>(`${environment.apiUrlAuth}/${ruta}`, datos, { headers: this.headers(false) });
  }

  /** Descarga un archivo binario o de texto como Blob. */
  blob(ruta: string, params?: Record<string, unknown>): Observable<Blob> {
    return this.http.get(`${environment.apiUrlAuth}/${ruta}`, {
      headers: this.headers(false), params: this.params(params), responseType: 'blob'
    });
  }

  /** Descarga un archivo y lo guarda con el nombre indicado. */
  descargar(ruta: string, nombre: string, params?: Record<string, unknown>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.blob(ruta, params).subscribe({
        next: (b) => { this.guardar(b, nombre); resolve(); },
        error: (e) => reject(e)
      });
    });
  }

  /** Abre en una pestaña nueva un PDF generado con una petición POST (por ejemplo la prefactura). */
  abrirPdfPost(ruta: string, cuerpo: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post(`${environment.apiUrlAuth}/${ruta}`, cuerpo, { headers: this.headers(), responseType: 'blob' }).subscribe({
        next: (b) => { window.open(URL.createObjectURL(b), '_blank'); resolve(); },
        error: (e) => reject(e)
      });
    });
  }

  /** Abre un PDF en una pestaña nueva. */
  abrirPdf(ruta: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.blob(ruta).subscribe({
        next: (b) => { window.open(URL.createObjectURL(b), '_blank'); resolve(); },
        error: (e) => reject(e)
      });
    });
  }

  guardar(b: Blob, nombre: string): void {
    const url = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
  }
}
