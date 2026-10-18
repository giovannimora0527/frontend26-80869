package com.uniminuto.clinica.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDate;

/**
 * Cliente del centro veterinario: persona propietaria de una o varias mascotas.
 */
@Entity
@Table(name = "cliente")
@Data
public class Cliente {

    /** Identificador del cliente. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cliente_id")
    private Long id;

    /** Usuario del sistema asociado al cliente, si lo tiene. */
    @Column(name = "usuario_id", unique = true)
    private Integer usuarioId;

    /** Tipo de documento (CC, TI, CE...). */
    @Column(name = "tipo_documento", nullable = false, length = 10)
    private String tipoDocumento;

    /** Número de documento; es único. */
    @Column(name = "numero_documento", nullable = false, unique = true, length = 20)
    private String numeroDocumento;

    /** Nombres del cliente. */
    @Column(name = "nombres", nullable = false, length = 100)
    private String nombres;

    /** Apellidos del cliente. */
    @Column(name = "apellidos", nullable = false, length = 100)
    private String apellidos;

    /** Fecha de nacimiento. */
    @Column(name = "fecha_nacimiento", nullable = false)
    private LocalDate fechaNacimiento;

    /** Género (M o F). */
    @Column(name = "genero", length = 1)
    private String genero;

    /** Teléfono de contacto. */
    @Column(name = "telefono", length = 20)
    private String telefono;

    /** Dirección de residencia. */
    @Column(name = "direccion", columnDefinition = "TEXT")
    private String direccion;

    /** Indica si el cliente está activo en el sistema. */
    @Column(name = "activo", nullable = false)
    private Boolean activo;
}
