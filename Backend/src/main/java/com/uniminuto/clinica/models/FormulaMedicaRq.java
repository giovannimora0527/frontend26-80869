package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * (request) para crear o actualizar una formula medica.
 */
@Data
public class FormulaMedicaRq {

    /** Identificador de la formula (solo requerido al actualizar). */
    private Long id;

    /** Identificador de la cita (consulta) asociada a la formula. */
    private Integer citaId;

    /** Identificador del medicamento recetado. */
    private Integer medicamentoId;

    /** Dosis indicada. */
    private String dosis;

    /** Frecuencia de administracion. */
    private String frecuencia;

    /** Duracion del tratamiento. */
    private String duracion;

    /** Indicaciones del tratamiento. */
    private String indicaciones;

    /** Fecha de emision de la formula. */
    private LocalDateTime fechaEmision;
}
