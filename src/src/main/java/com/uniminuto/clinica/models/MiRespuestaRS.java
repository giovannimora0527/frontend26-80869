package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Respuesta estándar de las operaciones de escritura (crear, editar, cancelar...).
 */
@Data
public class MiRespuestaRS {

    /** Código HTTP del resultado (200, 201...). */
    private int status;

    /** Mensaje de éxito para mostrar al usuario. */
    private String message;

    /** Identificador del registro creado o modificado; puede ser nulo. */
    private Long id;

    /**
     * Crea una respuesta con identificador del registro afectado.
     *
     * @param status  código HTTP
     * @param message mensaje para el usuario
     * @param id      identificador del registro creado o modificado
     * @return respuesta construida
     */
    public static MiRespuestaRS of(int status, String message, Long id) {
        MiRespuestaRS rs = new MiRespuestaRS();
        rs.setStatus(status);
        rs.setMessage(message);
        rs.setId(id);
        return rs;
    }

    /**
     * Crea una respuesta sin identificador.
     *
     * @param status  código HTTP
     * @param message mensaje para el usuario
     * @return respuesta construida
     */
    public static MiRespuestaRS of(int status, String message) {
        return of(status, message, null);
    }
}
