package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.exception.ResourceNotFoundException;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.MedicoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Implementación del servicio de consulta de veterinarios.
 */
@Service
public class MedicoServiceImpl implements MedicoService {

    /** Acceso a datos de veterinarios. */
    @Autowired
    private MedicoRepository medicoRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Medico> listarMedicos() {
        return medicoRepository.findAllByOrderByApellidosAscNombresAsc();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Medico consultarMedico(Long id) {
        return medicoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("El veterinario con ID " + id + " no existe"));
    }
}
