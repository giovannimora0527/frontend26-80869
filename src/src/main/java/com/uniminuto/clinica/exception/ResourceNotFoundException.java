package com.uniminuto.clinica.exception;

/**
 * Excepción para recursos que no existen cuando el identificador viaja en la URL
 * o como parámetro de consulta (por ejemplo {@code GET /cita/consultar/99}).
 * Se traduce a HTTP 404 (Not Found).
 */
public class ResourceNotFoundException extends RuntimeException {

    /**
     * Crea la excepción con un mensaje comprensible para el usuario.
     *
     * @param message descripción del registro que no fue encontrado
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
