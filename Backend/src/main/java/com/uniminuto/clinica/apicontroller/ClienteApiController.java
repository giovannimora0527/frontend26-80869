package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.ClienteApi;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST que expone la consulta de clientes.
 */
@RestController
public class ClienteApiController implements ClienteApi {

    @Autowired
    private ClienteService clienteService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<Cliente>> listarClientes() throws BadRequestException {
        return ResponseEntity.ok(clienteService.listarClientes());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<Cliente> obtenerCliente(Long id) throws BadRequestException {
        return ResponseEntity.ok(clienteService.obtenerPorId(id));
    }
}
