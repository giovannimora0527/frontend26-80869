package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Clase que representa la solicitud para crear o actualizar una mascota.
 */
@Data
public class MascotaRq {

    /**
     * Id unico de la mascota.
     */
    private Integer mascotaId;

    /**
     * Nombre de la mascota.
     */
    private String nombre;

    /**
     * Edad de la mascota.
     */
    private Integer edad;

    /**
     * Identificador de la raza de la mascota.
     */
    private Integer razaId;

    /**
     * Identificador del cliente propietario de la mascota.
     */
    private Long clienteId;

}
