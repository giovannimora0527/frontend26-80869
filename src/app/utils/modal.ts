import { Modal } from 'bootstrap';

/**
 * Abre un modal de Bootstrap por su id.
 *
 * @param id Id del elemento HTML del modal.
 */
export function abrirModal(id: string): void {
  const elemento = document.getElementById(id);
  if (elemento) {
    Modal.getOrCreateInstance(elemento).show();
  }
}

/**
 * Cierra un modal de Bootstrap por su id.
 *
 * @param id Id del elemento HTML del modal.
 */
export function cerrarModal(id: string): void {
  const elemento = document.getElementById(id);
  if (elemento) {
    Modal.getOrCreateInstance(elemento).hide();
  }
}
