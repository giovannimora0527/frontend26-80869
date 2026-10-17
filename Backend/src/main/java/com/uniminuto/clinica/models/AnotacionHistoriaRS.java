package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * (response) que representa una anotacion de historia medica.
 */
@Data
public class AnotacionHistoriaRS {

    /** Identificador unico de la anotacion. */
    private Long id;

    /** Identificador de la historia clinica. */
    private Integer historiaId;

    /** Identificador del medico. */
    private Integer medicoId;

    /** Nombre completo del veterinario (para mostrar). */
    private String medicoNombre;

    /** Fecha y hora de la anotacion. */
    private LocalDateTime fecha;

    /** Descripcion de la anotacion. */
    private String descripcion;

    /** Observacion adicional. */
    private String observacion;

    /** Diagnostico o evolucion. */
    private String diagnostico;
}
