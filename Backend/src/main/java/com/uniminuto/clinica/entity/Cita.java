package com.uniminuto.clinica.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * no usamos jpa, se usaron relaciones planas sencillas para hacer mas sencillo el codigo
 */
@Data
@Entity
@Table(name = "cita")
public class Cita {

    /** Identificador único de la cita (PK, autoincrementable). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /** Identificador del cliente dueño de la mascota citada. */
    @Column(name = "cliente_id", nullable = false)
    private Integer clienteId;

    /** Identificador de la mascota a la que corresponde la cita. */
    @Column(name = "mascota_id", nullable = false)
    private Integer mascotaId;

    /** Identificador del médico asignado a la cita. */
    @Column(name = "medico_id", nullable = false)
    private Integer medicoId;


    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    /** "programada", "atendida", "cancelada") */
    @Column(name = "estado", nullable = false, length = 20)
    private String estado;


    @Column(name = "motivo", columnDefinition = "TEXT")
    private String motivo;
}