package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.exception.ResourceNotFoundException;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Implementación del servicio de consulta de clientes.
 */
@Service
public class ClienteServiceImpl implements ClienteService {

    /** Acceso a datos de clientes. */
    @Autowired
    private ClienteRepository clienteRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Cliente> listarClientes() {
        return clienteRepository.findAllByOrderByApellidosAscNombresAsc();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Cliente consultarCliente(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("El cliente con ID " + id + " no existe"));
    }
}
