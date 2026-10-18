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
 * Fórmula médica emitida por un veterinario durante una consulta. Nunca se elimina
 * físicamente: se inactiva ({@code activo = false}) para conservar el historial clínico.
 */
@Entity
@Table(name = "formula_medica")
@Data
public class FormulaMedica {

    /** Identificador de la fórmula. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    /** Cita (consulta) en la que se emite la fórmula. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "cita_id", nullable = false)
    private Cita cita;

    /** Mascota tratada; es la misma de la cita. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "mascota_id", nullable = false)
    private Mascota mascota;

    /** Veterinario que emite la fórmula. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    /** Historia clínica asociada; nula si la consulta aún no tiene historia. */
    @ManyToOne
    @JoinColumn(name = "historia_id")
    private HistoriaMedica historia;

    /** Medicamento recetado. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "medicamento_id", nullable = false)
    private Medicamento medicamento;

    /** Dosis, por ejemplo "500 mg". */
    @Column(name = "dosis", nullable = false, columnDefinition = "TEXT")
    private String dosis;

    /** Frecuencia de administración, por ejemplo "cada 8 horas". */
    @Column(name = "frecuencia", nullable = false, length = 100)
    private String frecuencia;

    /** Duración del tratamiento en días. */
    @Column(name = "duracion_dias", nullable = false)
    private Integer duracionDias;

    /** Indicaciones para el cliente. */
    @Column(name = "indicaciones", nullable = false, columnDefinition = "TEXT")
    private String indicaciones;

    /** Fecha y hora de emisión de la fórmula. */
    @Column(name = "fecha_emision", nullable = false)
    private LocalDateTime fechaEmision;

    /** Indica si la fórmula está vigente; {@code false} cuando fue inactivada. */
    @Column(name = "activo", nullable = false)
    private Boolean activo;

    /** Fecha y hora de creación del registro. */
    @Column(name = "fecha_creacion_registro", nullable = false)
    private LocalDateTime fechaCreacionRegistro;

    /** Fecha y hora de la última modificación del registro. */
    @Column(name = "fecha_actualizacion_registro")
    private LocalDateTime fechaActualizacionRegistro;
}
