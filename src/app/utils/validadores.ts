import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Valida que un texto no esté vacío ni formado solo por espacios.
 *
 * @returns Validador de Angular; error `requerido` si está en blanco.
 */
export function noEnBlanco(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    return typeof valor === 'string' && valor.trim().length > 0 ? null : { requerido: true };
  };
}
