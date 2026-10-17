package com.uniminuto.clinica.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Entidad que representa una especialización médica.
 * Mapea la tabla (especializacion) de la base de datos de la clínica.
 * Es requerida como soporte de la relación ManyToOne de (Medico)
 * (requerimiento 5 del parcial: listar médicos con su especialización).
 */
@Data
@Entity
@Table(name = "especializacion")
public class Especializacion {

    /** Identificador único de la especialización (PK, autoincremental). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /** Nombre de la especialización (ej. "Cardiología"). */
    @Column(name = "nombre", nullable = false, length = 100, unique = true)
    private String nombre;

    /** Descripción detallada de la especialización. */
    @Column(name = "descripcion", columnDefinition = "TEXT")
    private String descripcion;

    /** Código corto y único que identifica la especialización (ej. "COD_01"). */
    @Column(name = "codigo_especializacion", nullable = false, length = 10, unique = true)
    private String codigoEspecializacion;
}