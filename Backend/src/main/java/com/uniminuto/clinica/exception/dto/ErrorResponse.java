package com.uniminuto.clinica.exception.dto;

import lombok.Data;

/**
 * Clase que representa la estructura de la respuesta de error
 * para las excepciones manejadas por el GlobalExceptionHandler.
 */
@Data
public class ErrorResponse {

    private int status;
    private String error;
    private String message;

    public ErrorResponse(int status, String error, String message) {
        this.status = status;
        this.error = error;
        this.message = message;
    }

}
