package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * (request) para crear o actualizar una historia medica.
 * Incluye los campos solicitados en el punto 3.2 del enunciado.
 */
@Data
public class HistoriaMedicaRQ {

    /** Identificador de la historia (solo requerido al actualizar). */
    private Long id;

    /** Identificador del cliente dueño de la mascota (para validar pertenencia). */
    private Integer clienteId;

    /** Identificador de la mascota (paciente) dueña de la historia. */
    private Integer pacienteId;

    /** Identificador de la cita (consulta) asociada. */
    private Integer citaId;

    /** Identificador del veterinario que atendio la consulta. */
    private Integer medicoId;

    /** Motivo de la consulta. */
    private String motivo;

    /** Diagnostico registrado. */
    private String diagnostico;

    /** Observaciones adicionales. */
    private String observaciones;

    /** Estado de la historia / consulta. */
    private String estado;
}
