package com.uniminuto.clinica.exception;

/**
 * Excepción para operaciones que chocan con el estado actual de los datos:
 * citas duplicadas, veterinario no disponible, intentos de modificar información
 * que ya no es modificable, etc. Se traduce a HTTP 409 (Conflict).
 */
public class ConflictException extends RuntimeException {

    /**
     * Crea la excepción con un mensaje comprensible para el usuario.
     *
     * @param message descripción del conflicto detectado
     */
    public ConflictException(String message) {
        super(message);
    }
}
