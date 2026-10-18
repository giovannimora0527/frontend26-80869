package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Datos recibidos para registrar una raza nueva.
 */
@Data
public class RazaRq {

    /** Identificador de la raza (solo informativo; se genera automáticamente al crear). */
    private Integer razaId;

    /** Nombre de la raza. */
    private String nombre;

    /** Especie a la que pertenece la raza. */
    private String especie;
}
