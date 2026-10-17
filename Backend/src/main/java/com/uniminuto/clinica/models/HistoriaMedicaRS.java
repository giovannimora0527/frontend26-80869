package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * (response) que representa una historia clinica. Ademas de los datos clinicos
 * resuelve los nombres de la mascota, el cliente y el veterinario para
 * mostrarlos directamente en el listado (punto 3.1 del enunciado), y la
 * cantidad de anotaciones asociadas.
 */
@Data
public class HistoriaMedicaRS {

    /** Identificador unico de la historia. */
    private Long id;

    /** Identificador de la mascota (paciente). */
    private Integer pacienteId;

    /** Nombre de la mascota (para mostrar en el listado). */
    private String mascotaNombre;

    /** Nombre completo del cliente dueño de la mascota. */
    private String clienteNombre;

    /** Identificador de la cita asociada. */
    private Integer citaId;

    /** Identificador del veterinario. */
    private Integer medicoId;

    /** Nombre completo del veterinario (para mostrar en el listado). */
    private String medicoNombre;

    /** Motivo de la consulta. */
    private String motivo;

    /** Diagnostico registrado. */
    private String diagnostico;

    /** Observaciones adicionales. */
    private String observaciones;

    /** Estado de la historia / consulta. */
    private String estado;

    /** Numero de anotaciones registradas en la historia. */
    private Integer totalAnotaciones;

    /** Fecha de creacion de la historia. */
    private LocalDateTime fechaCreacion;
}
