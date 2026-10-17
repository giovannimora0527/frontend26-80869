package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.service.MedicamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Implementacion de la logica de negocio para la consulta de medicamentos.
 */
@Service
public class MedicamentoServiceImpl implements MedicamentoService {

    @Autowired
    private MedicamentoRepository medicamentoRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Medicamento> listarMedicamentos() throws BadRequestException {
        return medicamentoRepository.findAllByOrderByNombreAsc();
    }
}
