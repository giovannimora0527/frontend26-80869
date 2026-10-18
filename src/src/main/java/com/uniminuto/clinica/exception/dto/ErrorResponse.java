package com.uniminuto.clinica.exception.dto;

import lombok.Data;

/**
 * Estructura uniforme de las respuestas de error de la API. El frontend lee {@code message}
 * para mostrar el mensaje al usuario; nunca contiene trazas ni detalles técnicos.
 */
@Data
public class ErrorResponse {

    /** Código HTTP de la respuesta, por ejemplo 400, 404 o 409. */
    private int status;

    /** Texto estándar del código HTTP, por ejemplo {@code "Bad Request"}. */
    private String error;

    /** Mensaje comprensible para el usuario que explica qué ocurrió. */
    private String message;

    /**
     * Crea una respuesta de error.
     *
     * @param status  código HTTP
     * @param error   texto estándar del código HTTP
     * @param message mensaje para el usuario
     */
    public ErrorResponse(int status, String error, String message) {
        this.status = status;
        this.error = error;
        this.message = message;
    }
}
