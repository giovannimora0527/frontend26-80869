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
 * Mascota registrada en el centro veterinario. Siempre pertenece a un cliente (1:N).
 */
@Entity
@Table(name = "mascota")
@Data
public class Mascota {

    /** Identificador de la mascota. */
    @Id
    @Column(name = "mascota_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer mascotaId;

    /** Nombre de la mascota. */
    @Column(name = "nombre_mascota", nullable = false, length = 100)
    private String nombreMascota;

    /** Edad en años. */
    @Column(name = "edad", nullable = false)
    private Integer edad;

    /** Fecha y hora en que se registró. */
    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro;

    /** Fecha y hora de la última modificación; nula si nunca se modificó. */
    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;

    /** Cliente propietario. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    /** Raza de la mascota. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "raza_id", nullable = false)
    private Raza raza;
}
