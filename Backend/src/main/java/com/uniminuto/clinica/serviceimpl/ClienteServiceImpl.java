package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClienteServiceImpl implements ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;


    @Override
    public List<Cliente> listarClientes() throws BadRequestException {
        return clienteRepository.findAll().stream()
                .sorted((c1, c2) -> c1.getNombres().compareToIgnoreCase(c2.getNombres()))
                .toList();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Cliente obtenerPorId(Long id) throws BadRequestException {
        if (id == null) {
            throw new BadRequestException("El identificador del cliente es obligatorio.");
        }
        return clienteRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("El cliente solicitado no existe."));
    }
}
