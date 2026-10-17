package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.exception.BadRequestException;

import java.util.List;

/**
 * Contrato de negocio para la consulta de clientes.
 */
public interface ClienteService {

    /**
     * Lista todos los clientes registrados.
     *
     * @return listado de clientes.
     * @throws BadRequestException si ocurre un error de negocio.
     */
    List<Cliente> listarClientes() throws BadRequestException;

    /**
     * Obtiene un cliente por su identificador.
     *
     * @param id identificador del cliente.
     * @return cliente encontrado.
     * @throws BadRequestException si el cliente no existe.
     */
    Cliente obtenerPorId(Long id) throws BadRequestException;
}
