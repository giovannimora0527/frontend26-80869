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
 * Historia clínica de una consulta: nace de una cita atendida (una historia por cita) y
 * agrupa las anotaciones de seguimiento de la mascota.
 */
@Entity
@Table(name = "historia_medica")
@Data
public class HistoriaMedica {

    /** Identificador de la historia. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    /** Cliente propietario de la mascota. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    /** Mascota a la que pertenece la historia. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "mascota_id", nullable = false)
    private Mascota mascota;

    /** Cita atendida que originó la historia (única por historia). */
    @ManyToOne(optional = false)
    @JoinColumn(name = "cita_id", nullable = false)
    private Cita cita;

    /** Veterinario responsable de la consulta. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    /** Fecha y hora de la consulta. */
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    /** Motivo de la consulta. */
    @Column(name = "motivo", nullable = false, columnDefinition = "TEXT")
    private String motivo;

    /** Diagnóstico de la consulta. */
    @Column(name = "diagnostico", nullable = false, columnDefinition = "TEXT")
    private String diagnostico;

    /** Observaciones adicionales; opcional. */
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;

    /** Estado almacenado como etiqueta (Abierta o Cerrada), ver {@link com.uniminuto.clinica.enums.EstadoHistoria}. */
    @Column(name = "estado", nullable = false, length = 20)
    private String estado;
}
