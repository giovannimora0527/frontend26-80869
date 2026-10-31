import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Devuelve la fecha local en formato `AAAA-MM-DD` (el que usan los `input type="date"`).
 * Se arma con la fecha local y no con `toISOString()` para evitar que, en horas de la
 * noche, el desfase con UTC muestre el día siguiente.
 *
 * @param fecha fecha a convertir; por defecto, hoy.
 * @returns texto con formato `AAAA-MM-DD`.
 */
export function fechaLocalISO(fecha: Date = new Date()): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/**
 * Validador de control: la fecha no puede ser posterior a hoy.
 *
 * @param control campo con una fecha `AAAA-MM-DD`.
 * @returns `{ fechaFutura: true }` si es futura; `null` si es válida o está vacía.
 */
export function fechaNoFutura(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string | null;
  return valor && valor > fechaLocalISO() ? { fechaFutura: true } : null;
}

/**
 * Validador de grupo: la fecha de vencimiento debe ser posterior a la de compra.
 * Espera controles llamados `fechaCompra` y `fechaVence`.
 *
 * @param grupo formulario que contiene ambas fechas.
 * @returns `{ vencimientoInvalido: true }` si el orden es incorrecto; `null` en caso contrario.
 */
export function vencimientoPosterior(grupo: AbstractControl): ValidationErrors | null {
  const compra = grupo.get('fechaCompra')?.value as string | null;
  const vence = grupo.get('fechaVence')?.value as string | null;
  return compra && vence && vence <= compra ? { vencimientoInvalido: true } : null;
}
