package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.exception.BadRequestException;

import java.util.List;

/**
 * Contrato de negocio para la consulta de medicamentos.
 */
public interface MedicamentoService {

    /**
     * Lista los medicamentos registrados ordenados alfabeticamente.
     *
     * @return listado de medicamentos.
     * @throws BadRequestException si ocurre un error de negocio.
     */
    List<Medicamento> listarMedicamentos() throws BadRequestException;
}
