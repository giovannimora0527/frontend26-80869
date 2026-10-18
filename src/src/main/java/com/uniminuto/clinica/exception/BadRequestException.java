package com.uniminuto.clinica.exception;

import org.springframework.http.HttpStatus;

/**
 * Excepción para solicitudes inválidas: campos obligatorios vacíos, valores fuera de rango
 * o referencias a registros que no existen dentro del cuerpo de la petición.
 * Se traduce a HTTP 400 (Bad Request) en {@link GlobalExceptionHandler}.
 */
public class BadRequestException extends RuntimeException {

    /** Código HTTP asociado a la excepción (siempre 400). */
    private final HttpStatus status;

    /**
     * Crea la excepción con un mensaje comprensible para el usuario final.
     *
     * @param message descripción del problema detectado en la solicitud
     */
    public BadRequestException(String message) {
        super(message);
        this.status = HttpStatus.BAD_REQUEST;
    }

    /**
     * Obtiene el código HTTP asociado.
     *
     * @return {@link HttpStatus#BAD_REQUEST}
     */
    public HttpStatus getStatus() {
        return status;
    }
}
