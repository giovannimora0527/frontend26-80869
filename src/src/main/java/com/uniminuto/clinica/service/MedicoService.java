package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Medico;

import java.util.List;

/**
 * Operaciones de consulta de veterinarios.
 */
public interface MedicoService {

    /**
     * Lista todos los veterinarios ordenados por apellidos y nombres.
     *
     * @return veterinarios ordenados
     */
    List<Medico> listarMedicos();

    /**
     * Consulta un veterinario por su identificador.
     *
     * @param id identificador del veterinario
     * @return veterinario encontrado
     * @throws com.uniminuto.clinica.exception.ResourceNotFoundException si el veterinario no existe
     */
    Medico consultarMedico(Long id);
}
