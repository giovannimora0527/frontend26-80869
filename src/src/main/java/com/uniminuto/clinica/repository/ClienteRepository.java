package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acceso a datos de clientes.
 */
@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    /**
     * Lista los clientes ordenados alfabéticamente por apellidos y luego por nombres.
     *
     * @return clientes ordenados
     */
    List<Cliente> findAllByOrderByApellidosAscNombresAsc();
}
