package com.uniminuto.clinica.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Entidad que representa la historia clinica de una mascota.
 * Segun el enunciado (puntos 3.1 y 3.2), la historia registra la consulta
 * principal: a que mascota pertenece, la cita, el veterinario, el motivo, el
 * diagnostico, las observaciones y el estado. Ademas mantiene una relacion
 * 1:N con las anotaciones (notas de evolucion de las consultas realizadas).
 */
@Entity
@Table(name = "historia_medica")
@Data
public class HistoriaMedica {

    /** Identificador unico de la historia clinica (PK autoincremental). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    /** Identificador de la mascota (paciente) dueña de la historia. */
    @Column(name = "paciente_id", nullable = false)
    private Integer pacienteId;

    /** Identificador de la cita (consulta) asociada a la historia. */
    @Column(name = "cita_id")
    private Integer citaId;

    /** Identificador del veterinario que atendio la consulta. */
    @Column(name = "medico_id")
    private Integer medicoId;

    /** Motivo de la consulta. */
    @Column(name = "motivo", columnDefinition = "TEXT")
    private String motivo;

    /** Diagnostico registrado en la consulta. */
    @Column(name = "diagnostico", columnDefinition = "TEXT")
    private String diagnostico;

    /** Observaciones adicionales de la consulta. */
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    /** Estado de la historia / consulta. */
    @Column(name = "estado", length = 20)
    private String estado;

    /** Fecha de creacion de la historia clinica. */
    @Column(name = "fecha_creacion", columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime fechaCreacion;
}
