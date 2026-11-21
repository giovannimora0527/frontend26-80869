package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Datos para poner una contraseña nueva usando el código recibido por correo.
 */
@Data
public class RestablecerContrasenaRq {

    /** Nombre de usuario o correo electrónico de la cuenta (el mismo de la solicitud). */
    private String identificador;

    /** Código de 6 dígitos recibido por correo. */
    private String codigo;

    /** Contraseña nueva. */
    private String nuevaContrasena;
}
