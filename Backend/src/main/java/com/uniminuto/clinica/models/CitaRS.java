package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * (response) que representa una cita.
 */
@Data
public class CitaRS {


    private Long id;


    private Integer clienteId;


    private Integer mascotaId;


    private Integer medicoId;


    private LocalDateTime fechaHora;


    private String estado;


    private String motivo;
}