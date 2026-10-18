package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Datos recibidos para crear una historia clínica a partir de una cita atendida.
 */
@Data
public class HistoriaMedicaRq {

    /** Cliente propietario de la mascota. */
    private Long clienteId;

    /** Mascota de la historia; debe pertenecer al cliente. */
    private Integer mascotaId;

    /** Cita atendida que origina la historia; debe ser de la misma mascota. */
    private Long citaId;

    /** Veterinario responsable; opcional, por defecto el de la cita. */
    private Long medicoId;

    /** Fecha y hora de la consulta; opcional, por defecto la actual. */
    private LocalDateTime fechaHora;

    /** Motivo de la consulta. */
    private String motivo;

    /** Diagnóstico de la consulta. */
    private String diagnostico;

    /** Observaciones adicionales. */
    private String observaciones;
}
