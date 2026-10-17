package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * (request) para crear una anotacion de historia clinica.
 */
@Data
public class AnotacionHistoriaRq {

    /** Identificador de la mascota (opcional si se envia historiaId). */
    private Integer mascotaId;

    /** Identificador de la historia clinica (opcional si se envia mascotaId). */
    private Integer historiaId;

    /** Identificador del medico que registra la anotacion. */
    private Long medicoId;

    /** Descripcion de la anotacion. */
    private String descripcion;

    /** Observacion adicional. */
    private String observacion;

    /** Diagnostico o evolucion. */
    private String diagnostico;
}
