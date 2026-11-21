package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Datos del perfil que la persona puede modificar por sí misma.
 * No incluye usuario, documento ni perfil de acceso: esos solo los cambia un administrador.
 */
@Data
public class PerfilRq {

    /** Correo electrónico (obligatorio, no puede estar en uso por otro usuario). */
    private String email;

    /** Nombres (obligatorios si el usuario está asociado a una persona). */
    private String nombres;

    /** Apellidos (obligatorios si el usuario está asociado a una persona). */
    private String apellidos;

    /** Teléfono de contacto. Es opcional. */
    private String telefono;

    /** Dirección de residencia. Solo aplica a clientes; es opcional. */
    private String direccion;
}
