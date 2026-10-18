package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Cliente;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Contrato REST de consulta de clientes. Ruta base: {@code /cliente}.
 */
public interface ClienteApi {

    /**
     * {@code GET /cliente/listar}: lista todos los clientes ordenados por apellidos.
     *
     * @return 200 con la lista de clientes
     */
    @GetMapping("/listar")
    ResponseEntity<List<Cliente>> listarClientes();

    /**
     * {@code GET /cliente/consultar/{id}}: consulta un cliente.
     *
     * @param id identificador del cliente
     * @return 200 con el cliente, o 404 si no existe
     */
    @GetMapping("/consultar/{id}")
    ResponseEntity<Cliente> consultarCliente(@PathVariable("id") Long id);
}
