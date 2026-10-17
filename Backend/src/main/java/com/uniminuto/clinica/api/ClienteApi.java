package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.exception.BadRequestException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/cliente")
public interface ClienteApi {

    @GetMapping(value = "/listar",
            produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<List<Cliente>> listarClientes()
            throws BadRequestException;

    /**
     * Consulta un cliente por su identificador.
     *
     * @param id identificador del cliente.
     * @return cliente encontrado.
     * @throws BadRequestException si el cliente no existe.
     */
    @GetMapping(value = "/obtener/{id}", produces = {"application/json"})
    ResponseEntity<Cliente> obtenerCliente(@PathVariable("id") Long id) throws BadRequestException;
}
