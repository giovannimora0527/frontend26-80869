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
 * Código de un solo uso que se envía al correo cuando el usuario olvidó su contraseña.
 * <p>
 * Se guarda en una tabla aparte del OTP del inicio de sesión para que un código no
 * pueda usarse en el flujo equivocado.
 */
@Entity
@Table(name = "recuperacion_clave")
@Data
public class RecuperacionClave {

    /** Identificador único del código. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /** Usuario que pidió recuperar la contraseña. */
    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    /** Código de 6 dígitos enviado al correo. */
    @Column(name = "codigo", nullable = false, length = 6)
    private String codigo;

    /** Momento en que se generó el código. */
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;

    /** Momento a partir del cual el código ya no sirve. */
    @Column(name = "fecha_expiracion", nullable = false)
    private LocalDateTime fechaExpiracion;

    /** Cantidad de intentos fallidos con este código. */
    @Column(name = "intentos", nullable = false)
    private int intentos;

    /** Indica si el código ya se usó o fue invalidado. */
    @Column(name = "usado", nullable = false)
    private boolean usado;
}
