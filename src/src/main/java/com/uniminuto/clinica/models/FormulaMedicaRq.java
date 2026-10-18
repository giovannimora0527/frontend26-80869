package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * Datos recibidos para crear o editar una fórmula médica. En la edición solo se
 * toman en cuenta dosis, frecuencia, duración e indicaciones.
 */
@Data
public class FormulaMedicaRq {

    /** Cita (consulta) en la que se emite la fórmula; obligatoria al crear. */
    private Long citaId;

    /** Mascota; opcional, si no se envía se toma de la cita. */
    private Integer mascotaId;

    /** Veterinario; opcional, si no se envía se toma de la cita. */
    private Long medicoId;

    /** Historia clínica; opcional, si no se envía se busca la de la cita. */
    private Long historiaId;

    /** Medicamento recetado; obligatorio al crear. */
    private Long medicamentoId;

    /** Dosis, por ejemplo "500 mg"; debe contener una cantidad mayor que cero. */
    private String dosis;

    /** Frecuencia, por ejemplo "cada 8 horas". */
    private String frecuencia;

    /** Duración del tratamiento en días (entre 1 y 365). */
    private Integer duracionDias;

    /** Indicaciones para el cliente. */
    private String indicaciones;

    /** Fecha y hora de emisión; opcional, por defecto la actual. */
    private LocalDateTime fechaEmision;
}
