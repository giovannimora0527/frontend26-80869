import { Modal } from 'bootstrap';

/** Abre un modal de Bootstrap por su `id` (crea la instancia si no existe). */
export function abrirModal(id: string): void {
  const el = document.getElementById(id);
  if (el) {
    Modal.getOrCreateInstance(el).show();
  }
}

/** Cierra un modal de Bootstrap por su `id`. */
export function cerrarModal(id: string): void {
  const el = document.getElementById(id);
  if (el) {
    Modal.getOrCreateInstance(el).hide();
  }
}
