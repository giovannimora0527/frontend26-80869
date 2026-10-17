package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * clase para crear o actualizar una mascota.
 */
@Data
public class MascotaRq {


    private Integer mascotaId;


    private String nombre;


    private Integer edad;


    private Integer razaId;


    private Long clienteId;

}