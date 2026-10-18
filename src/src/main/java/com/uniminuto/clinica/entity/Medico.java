package com.uniminuto.clinica.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

/**
 * Médico veterinario del centro.
 */
@Entity
@Table(name = "medico")
@Data
public class Medico {

    /** Identificador del veterinario. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /** Tipo de documento. */
    @Column(name = "tipo_documento", nullable = false, length = 10)
    private String tipoDocumento;

    /** Número de documento; es único. */
    @Column(name = "numero_documento", nullable = false, unique = true, length = 20)
    private String numeroDocumento;

    /** Nombres del veterinario. */
    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;

    /** Apellidos del veterinario. */
    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos;

    /** Teléfono de contacto. */
    @Column(name = "telefono", length = 20)
    private String telefono;

    /** Registro profesional; es único. */
    @Column(name = "registro_profesional", nullable = false, unique = true, length = 50)
    private String registroProfesional;

    /** Identificador de su especialización. */
    @Column(name = "especializacion_id", nullable = false)
    private Integer especializacionId;
}
