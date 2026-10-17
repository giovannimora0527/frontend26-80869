package com.uniminuto.clinica.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Entidad que representa una anotacion (nota de evolucion) dentro de una
 * historia clinica. Cada anotacion corresponde a una consulta realizada por
 * un medico. Se modela con identificadores planos (historia_id, medico_id) y
 * separa la descripcion, la observacion y el diagnostico/evolucion segun pide
 * el enunciado.
 */
@Entity
@Table(name = "anotacion_historia")
@Data
public class AnotacionHistoria {

    /** Identificador unico de la anotacion (PK autoincremental). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    /** Identificador de la historia clinica a la que pertenece la anotacion. */
    @Column(name = "historia_id", nullable = false)
    private Integer historiaId;

    /** Identificador del medico que registro la anotacion. */
    @Column(name = "medico_id", nullable = false)
    private Integer medicoId;

    /** Fecha y hora en que se registro la anotacion. */
    @Column(name = "fecha", columnDefinition = "DATETIME DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime fecha;

    /** Descripcion de la anotacion. */
    @Column(name = "descripcion", nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    /** Observacion adicional de la consulta. */
    @Column(name = "observacion", columnDefinition = "TEXT")
    private String observacion;

    /** Diagnostico o evolucion del paciente. */
    @Column(name = "diagnostico", columnDefinition = "TEXT")
    private String diagnostico;
}
