import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

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

/**
 * Validador de control: contraseña de 8 a 100 caracteres con al menos una letra y un número
 * (el backend aplica esta misma regla).
 *
 * @param control campo con la contraseña.
 * @returns `{ formatoPassword: true }` si no cumple; `null` si cumple o está vacío.
 */
export function formatoPassword(control: AbstractControl): ValidationErrors | null {
  const valor: string = control.value ?? '';
  if (!valor) {
    return null;
  }
  const valida = valor.length >= 8 && valor.length <= 100 && /[A-Za-z]/.test(valor) && /\d/.test(valor);
  return valida ? null : { formatoPassword: true };
}

/**
 * Validador de grupo: el campo de confirmación debe ser igual al de la contraseña.
 *
 * @param campo nombre del control con la contraseña.
 * @param confirmacion nombre del control con la confirmación.
 * @returns validador que devuelve `{ noCoincide: true }` si los textos son distintos.
 */
export function confirmacionIgual(campo: string, confirmacion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const a = grupo.get(campo)?.value;
    const b = grupo.get(confirmacion)?.value;
    return a && b && a !== b ? { noCoincide: true } : null;
  };
}
