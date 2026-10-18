package com.uniminuto.clinica.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Anotación de seguimiento dentro de una historia clínica. Es un registro histórico:
 * una vez creada no se edita ni se elimina.
 */
@Entity
@Table(name = "anotacion_historia")
@Data
public class AnotacionHistoria {

    /** Identificador de la anotación. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    /** Historia clínica a la que pertenece. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "historia_id", nullable = false)
    private HistoriaMedica historia;

    /** Veterinario que escribió la anotación. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    /** Fecha y hora de la anotación. */
    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha;

    /** Descripción de lo realizado u observado. */
    @Column(name = "descripcion", nullable = false, columnDefinition = "TEXT")
    private String descripcion;

    /** Observaciones del veterinario. */
    @Column(name = "observacion", nullable = false, columnDefinition = "TEXT")
    private String observacion;

    /** Diagnóstico o evolución del paciente. */
    @Column(name = "diagnostico", nullable = false, columnDefinition = "TEXT")
    private String diagnostico;
}
