package com.uniminuto.clinica.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Entidad que representa un médico de la clínica.
 * Mapea la tabla (code medico) y mantiene una relación ManyToOne con
 * (link Especializacion), ya que varios médicos pueden compartir la misma
 * especialización
 */
@Data
@Entity
@Table(name = "medico")
public class Medico {

    /** Identificador único del médico (PK, autoincremental). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;


    @Column(name = "tipo_documento", nullable = false, length = 10)
    private String tipoDocumento;


    @Column(name = "numero_documento", nullable = false, length = 20, unique = true)
    private String numeroDocumento;


    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;


    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos;


    @Column(name = "telefono", length = 20)
    private String telefono;


    @Column(name = "registro_profesional", nullable = false, length = 50, unique = true)
    private String registroProfesional;

    /**
     * Relación ManyToOne: varios médicos pueden tener la misma especialización.
     * Se mapea contra la columna (especializacion_id) de la tabla (code medico).
     */
    @ManyToOne
    @JoinColumn(name = "especializacion_id", nullable = false)
    private Especializacion especializacion;
}