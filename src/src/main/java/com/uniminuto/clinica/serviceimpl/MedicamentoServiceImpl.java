package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.service.MedicamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Implementación del servicio de consulta de medicamentos.
 */
@Service
public class MedicamentoServiceImpl implements MedicamentoService {

    /** Acceso a datos de medicamentos. */
    @Autowired
    private MedicamentoRepository medicamentoRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Medicamento> listarMedicamentos() {
        return medicamentoRepository.findAllByOrderByNombreAsc();
    }
}
