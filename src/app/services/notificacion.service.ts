import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

/**
 * Mensajes de éxito, error y confirmación para toda la aplicación (SweetAlert2).
 */
@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  /**
   * Muestra un mensaje de operación exitosa.
   *
   * @param mensaje Texto para el usuario.
   */
  exito(mensaje: string): void {
    void Swal.fire({ icon: 'success', title: 'Operación exitosa', text: mensaje, timer: 2500, showConfirmButton: false });
  }

  /**
   * Muestra un mensaje de error.
   *
   * @param mensaje Texto comprensible para el usuario.
   */
  error(mensaje: string): void {
    void Swal.fire({ icon: 'error', title: 'No se pudo completar', text: mensaje });
  }

  /**
   * Pide confirmación antes de una acción sensible.
   *
   * @param pregunta Texto de la pregunta.
   * @returns `true` si el usuario confirma.
   */
  async confirmar(pregunta: string): Promise<boolean> {
    const resultado = await Swal.fire({
      icon: 'question',
      title: 'Confirmar',
      text: pregunta,
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    });
    return resultado.isConfirmed;
  }
}
