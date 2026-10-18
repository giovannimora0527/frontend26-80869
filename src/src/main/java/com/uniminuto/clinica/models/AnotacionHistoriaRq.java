package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Datos recibidos para agregar una anotación a una historia clínica existente.
 */
@Data
public class AnotacionHistoriaRq {

    /** Historia clínica a la que se agrega la anotación. */
    private Long historiaId;

    /** Veterinario que escribe la anotación. */
    private Long medicoId;

    /** Fecha y hora de la anotación; opcional, por defecto la actual. */
    private LocalDateTime fecha;

    /** Descripción de lo realizado u observado durante el seguimiento. */
    private String descripcion;

    /** Observaciones adicionales del veterinario. */
    private String observacion;

    /** Diagnóstico o evolución del paciente. */
    private String diagnostico;
}
