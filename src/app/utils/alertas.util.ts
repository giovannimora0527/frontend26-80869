import Swal from 'sweetalert2';

/** Mensaje de éxito (se cierra solo). */
export function alertaExito(mensaje: string): void {
  Swal.fire({ icon: 'success', title: 'Listo', text: mensaje, timer: 2200, showConfirmButton: false });
}

/** Mensaje de error con el texto que entiende el usuario. */
export function alertaError(mensaje: string): void {
  Swal.fire({ icon: 'error', title: 'No se pudo completar', text: mensaje });
}

/** Pide confirmación antes de una acción sensible. Devuelve `true` si el usuario acepta. */
export async function confirmar(titulo: string, texto: string, textoBoton = 'Sí, continuar'): Promise<boolean> {
  const r = await Swal.fire({
    icon: 'question',
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: textoBoton,
    cancelButtonText: 'Cancelar'
  });
  return r.isConfirmed;
}
