import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Cliente } from '../models/cliente';
import { Mascota } from '../models/mascota';

export interface MiRespuestaRS<T> {
  status: number;
  message: string;
  data: T;
}

export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
}

export interface Medico {
  id?: number;
  medicoId?: number;
  nombre?: string;
  nombres?: string;
  apellidos?: string;
  nombreCompleto?: string;
}

export interface CitaRq {
  mascotaId: number;
  medicoId: number;
  fechaHora: string;
  motivo: string;
}

export interface FormulaMedicaRq {
  citaId: number;
  medicamentoId: number;
  nombreMedicamento: string;
  presentacion: string;
  descripcion: string;
  dosis: string;
  indicaciones: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClinicaVeterinariaService {
  private readonly apiUrl = environment.apiUrlAuth.replace(/\/$/, '');

  constructor(private readonly http: HttpClient) {}

  listarClientes(): Observable<MiRespuestaRS<Cliente[]>> {
    return this.http.get<MiRespuestaRS<Cliente[]>>(`${this.apiUrl}/cliente/listar`);
  }

  buscarMascotasPorCliente(clienteId: number): Observable<MiRespuestaRS<Mascota[]>> {
    const params = new HttpParams().set('clienteId', clienteId);
    return this.http.get<MiRespuestaRS<Mascota[]>>(
      `${this.apiUrl}/mascota/buscar-by-cliente`,
      { params }
    );
  }

  listarMedicos(): Observable<MiRespuestaRS<Medico[]>> {
    return this.http.get<MiRespuestaRS<Medico[]>>(`${this.apiUrl}/medico/listar`);
  }

  crearCita(cita: CitaRq): Observable<MiRespuestaRS<unknown>> {
    return this.http.post<MiRespuestaRS<unknown>>(`${this.apiUrl}/cita/crear`, cita);
  }

  guardarFormulaMedica(
    formula: FormulaMedicaRq
  ): Observable<MiRespuestaRS<unknown>> {
    return this.http.post<MiRespuestaRS<unknown>>(
      `${this.apiUrl}/formula-medica/guardar`,
      formula
    );
  }
}
