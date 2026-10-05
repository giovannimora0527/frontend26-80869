import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormulaMedica } from '../../../../models/formula-medica';

/**
 * Servicio para gestionar las operaciones HTTP de fórmulas médicas.
 * Se comunica con el backend de la clínica veterinaria.
 * @author Yulian Montealegre
 */
@Injectable({
  providedIn: 'root'
})
export class FormulaMedicaService {
  private apiUrl = 'http://localhost:8080/clinica/v1/api/formulas-medicas';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las fórmulas médicas ordenadas por fecha.
   */
  obtenerFormulas(): Observable<FormulaMedica[]> {
    return this.http.get<FormulaMedica[]>(this.apiUrl);
  }

  /**
   * Crea una nueva fórmula médica.
   */
  crearFormula(formula: FormulaMedica): Observable<any> {
    return this.http.post(`${this.apiUrl}/crear`, formula);
  }

  /**
   * Actualiza una fórmula médica existente.
   */
  actualizarFormula(id: number, formula: FormulaMedica): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizar/${id}`, formula);
  }
}