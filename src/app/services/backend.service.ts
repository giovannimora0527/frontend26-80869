import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  constructor(private http: HttpClient) { }

  construirHeader() {
    // Aqui obtenemos el token desde el local storage
    const tokenRecuperado = localStorage.getItem('token');
    if (tokenRecuperado != '') {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
        Authorization: 'Bearer ' + tokenRecuperado,
      });
      return headers;
    } else {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      });
      return headers;
    }
  }

  // Servicio generico para realizar peticiones GET al backend.
  get<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    routerParams?: HttpParams
  ) {
    const tokenRecuperado = localStorage.getItem('token') || ''; // Evita `null`
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: tokenRecuperado ? `Bearer ${tokenRecuperado}` : '',
    });
    return this.http.get<T>(`${urlApi}/${endpoint}/${service}`, {
      params: routerParams,
      headers: headers,
      withCredentials: true,
    });
  }


  // Servicio generico para realizar peticiones POST al backend.
  post<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Observable<T> {
    const tokenRecuperado = localStorage.getItem('token') || ''; // Evita `null`
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: tokenRecuperado ? `Bearer ${tokenRecuperado}` : '',
    });
    return this.http.post<T>(`${urlApi}/${endpoint}/${service}`, data, {
      headers: headers,
      withCredentials: true,
    });
  }

  // Servicio generico para realizar peticiones PUT al backend.
  put<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Observable<T> {
    const tokenRecuperado = localStorage.getItem('token') || ''; // Evita `null`
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: tokenRecuperado ? `Bearer ${tokenRecuperado}` : '',
    });
    return this.http.put<T>(`${urlApi}/${endpoint}/${service}`, data, {
      headers: headers,
    });
  }

  // Servicio generico para realizar peticiones POST al backend con archivos.
  postFile<T>(
    urlApi: string,
    endpoint: string,
    service: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Observable<T> {
    const tokenRecuperado = localStorage.getItem('token') || ''; // Evita `null`
    const headers = new HttpHeaders({
      mimeType: 'multipart/form-data',
      Authorization: tokenRecuperado ? `Bearer ${tokenRecuperado}` : '',
    });
    return this.http.post<T>(`${urlApi}/${endpoint}/${service}`, data, {
      headers: headers,
      withCredentials: true,
    });
  }
}
