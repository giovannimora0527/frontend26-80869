package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;

/**
 * Datos que envía una persona nueva para registrarse en el sistema.
 * Con ellos se crean a la vez su usuario y su ficha de cliente.
 */
@Data
public class RegistroRq {

    /** Nombre de usuario (4 a 30 caracteres: letras, números, punto, guion o guion bajo). */
    private String username;

    /** Contraseña (mínimo 8 caracteres, con al menos una letra y un número). */
    private String password;

    /** Correo electrónico donde llegarán los códigos de verificación. */
    private String email;

    /** Tipo de documento: CC, CE, TI o PA. */
    private String tipoDocumento;

    /** Número de documento. */
    private String numeroDocumento;

    /** Nombres de la persona. */
    private String nombres;

    /** Apellidos de la persona. */
    private String apellidos;

    /** Fecha de nacimiento (formato AAAA-MM-DD). */
    private LocalDate fechaNacimiento;

    /** Género: M, F u O. Es opcional. */
    private String genero;

    /** Teléfono de contacto. Es opcional. */
    private String telefono;

    /** Dirección de residencia. Es opcional. */
    private String direccion;
}
