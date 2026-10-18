package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Medicamento;

import java.util.List;

/**
 * Operaciones de consulta de medicamentos, necesarias para llenar el combo del
 * formulario de fórmulas médicas.
 */
public interface MedicamentoService {

    /**
     * Lista todos los medicamentos ordenados por nombre.
     *
     * @return medicamentos ordenados alfabéticamente
     */
    List<Medicamento> listarMedicamentos();
}
