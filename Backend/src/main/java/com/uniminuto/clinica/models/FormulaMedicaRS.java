package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * (response) que representa una formula medica.
 */
@Data
public class FormulaMedicaRS {

    /** Identificador unico de la formula. */
    private Long id;

    /** Identificador de la cita asociada. */
    private Integer citaId;

    /** Identificador del medicamento. */
    private Integer medicamentoId;

    /** Nombre del medicamento (para mostrar en el listado). */
    private String medicamentoNombre;

    /** Nombre de la mascota asociada a la cita (para mostrar). */
    private String mascotaNombre;

    /** Dosis indicada. */
    private String dosis;

    /** Frecuencia de administracion. */
    private String frecuencia;

    /** Duracion del tratamiento. */
    private String duracion;

    /** Indicaciones del tratamiento. */
    private String indicaciones;

    /** Indica si la formula esta activa. */
    private Boolean activo;

    /** Fecha de emision / creacion del registro. */
    private LocalDateTime fechaCreacionRegistro;

    /** Fecha de la ultima actualizacion. */
    private LocalDateTime fechaActualizacionRegistro;
}
