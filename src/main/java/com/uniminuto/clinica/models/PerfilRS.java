package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Perfil de la persona que inició sesión: datos de la cuenta y, si la tiene,
 * los datos de la persona asociada (cliente o médico). Nunca incluye la contraseña.
 */
@Data
public class PerfilRS {

    /** Id del usuario. */
    private Long usuarioId;

    /** Nombre de usuario. */
    private String username;

    /** Correo electrónico. */
    private String email;

    /** Id del perfil de acceso (1=Administrador, 2=Recepción, 3=Médico, 4=Cliente). */
    private Integer rol;

    /** Nombre del perfil de acceso. */
    private String perfil;

    /** Tipo de persona asociada: {@code CLIENTE}, {@code MEDICO} o {@code null} si no tiene. */
    private String tipoPersona;

    /** Id de la persona asociada. */
    private Long personaId;

    /** Tipo de documento de la persona asociada. */
    private String tipoDocumento;

    /** Número de documento de la persona asociada. */
    private String numeroDocumento;

    /** Nombres de la persona asociada. */
    private String nombres;

    /** Apellidos de la persona asociada. */
    private String apellidos;

    /** Teléfono de la persona asociada. */
    private String telefono;

    /** Dirección de la persona asociada (solo clientes). */
    private String direccion;
}
