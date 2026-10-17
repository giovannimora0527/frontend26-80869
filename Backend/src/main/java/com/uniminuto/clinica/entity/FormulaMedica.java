package com.uniminuto.clinica.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Entidad que representa una formula medica (receta) generada en una consulta.
 * Se modela con identificadores planos (cita_id, medicamento_id) para mantener
 * la coherencia con el resto de entidades de la aplicacion y simplificar el
 * mapeo contra la base de datos.
 */
@Entity
@Table(name = "formula_medica")
@Data
public class FormulaMedica {

    /** Identificador unico de la formula (PK autoincremental). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    /** Identificador de la cita (consulta) a la que pertenece la formula. */
    @Column(name = "cita_id", nullable = false)
    private Integer citaId;

    /** Identificador del medicamento recetado. */
    @Column(name = "medicamento_id", nullable = false)
    private Integer medicamentoId;

    /** Dosis indicada para el medicamento. */
    @Column(name = "dosis", nullable = false, columnDefinition = "TEXT")
    private String dosis;

    /** Frecuencia de administracion (ej. cada 8 horas). */
    @Column(name = "frecuencia", length = 100)
    private String frecuencia;

    /** Duracion del tratamiento (ej. 7 dias). */
    @Column(name = "duracion", length = 100)
    private String duracion;

    /** Indicaciones adicionales para el tratamiento. */
    @Column(name = "indicaciones", columnDefinition = "TEXT")
    private String indicaciones;

    /** Indica si la formula esta activa (para inactivacion logica). */
    @Column(name = "activo")
    private Boolean activo;

    /** Fecha en la que se registro (emitio) la formula. */
    @Column(name = "fecha_creacion_registro", nullable = false)
    private LocalDateTime fechaCreacionRegistro;

    /** Fecha de la ultima actualizacion de la formula. */
    @Column(name = "fecha_actualizacion_registro")
    private LocalDateTime fechaActualizacionRegistro;
}
