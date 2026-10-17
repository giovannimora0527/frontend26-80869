package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * (request) para crear o actualizar una cita.
 */
@Data
public class CitaRq {

    /** Identificador de la cita (solo requerido al actualizar). */
    private Long id;

    /** Identificador del cliente dueño de la mascota (para validar pertenencia). */
    private Integer clienteId;

    /** Identificador de la mascota citada. */
    private Integer mascotaId;

    /** Identificador del veterinario asignado. */
    private Long medicoId;

    /** Fecha y hora de la cita. */
    private LocalDateTime fechaHora;

    /** Motivo de la consulta. */
    private String motivo;

    /** Estado de la cita. */
    private String estado;
}
