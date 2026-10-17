package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * respuesta que representa un médico junto con los datos de su
 * especialización, "aplanados" para no exponer la entidad completa
 */
@Data
public class MedicoConEspecializacionRS {


    private Long id;


    private String nombres;


    private String apellidos;


    private String numeroDocumento;


    private String registroProfesional;


    private String especializacionNombre;


    private String especializacionCodigo;
}