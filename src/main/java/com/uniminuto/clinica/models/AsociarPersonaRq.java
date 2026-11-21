package com.uniminuto.clinica.models;

import lombok.Data;

/**
 * Solicitud (solo administrador) para vincular un usuario con un cliente o un médico.
 */
@Data
public class AsociarPersonaRq {

    /** Id del usuario que se quiere vincular. */
    private Long usuarioId;

    /** Tipo de persona: {@code CLIENTE} o {@code MEDICO}. */
    private String tipoPersona;

    /** Id del cliente o del médico, según el tipo. */
    private Long personaId;
}
