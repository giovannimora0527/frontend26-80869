package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Solicitud para recibir un código de recuperación de contraseña.
 */
@Data
public class OlvideContrasenaRq {

    /** Nombre de usuario o correo electrónico de la cuenta. */
    private String identificador;
}
