package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Datos para cambiar la contraseña de la persona que ya inició sesión.
 */
@Data
public class CambiarContrasenaRq {

    /** Contraseña actual (se pide para confirmar que es la misma persona). */
    private String contrasenaActual;

    /** Contraseña nueva. */
    private String nuevaContrasena;
}
