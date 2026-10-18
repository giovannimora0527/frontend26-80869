package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Cliente;

import java.util.List;

/**
 * Operaciones de consulta de clientes (propietarios de mascotas).
 */
public interface ClienteService {

    /**
     * Lista todos los clientes ordenados por apellidos y nombres.
     *
     * @return clientes ordenados
     */
    List<Cliente> listarClientes();

    /**
     * Consulta un cliente por su identificador.
     *
     * @param id identificador del cliente
     * @return cliente encontrado
     * @throws com.uniminuto.clinica.exception.ResourceNotFoundException si el cliente no existe
     */
    Cliente consultarCliente(Long id);
}
