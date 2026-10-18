package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.ClienteApi;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de consulta de clientes. Solo traduce HTTP ↔ servicio.
 */
@RestController
@RequestMapping("/cliente")
public class ClienteApiController implements ClienteApi {

    /** Servicio de consulta de clientes. */
    @Autowired
    private ClienteService clienteService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<Cliente>> listarClientes() {
        return ResponseEntity.ok(clienteService.listarClientes());
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<Cliente> consultarCliente(Long id) {
        return ResponseEntity.ok(clienteService.consultarCliente(id));
    }
}
