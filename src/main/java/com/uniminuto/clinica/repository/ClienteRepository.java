package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Acceso a datos de la tabla {@code cliente}.
 */
@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    /**
     * Busca un cliente por su número de documento.
     *
     * @param numeroDocumento documento a buscar.
     * @return el cliente, si existe.
     */
    Optional<Cliente> findByNumeroDocumento(String numeroDocumento);

    /**
     * Indica si ya existe un cliente con ese documento (para evitar duplicados al crear).
     *
     * @param numeroDocumento documento a verificar.
     * @return {@code true} si ya existe.
     */
    boolean existsByNumeroDocumento(String numeroDocumento);

    /**
     * Indica si otro cliente (distinto al indicado) usa ese documento (para evitar duplicados al editar).
     *
     * @param numeroDocumento documento a verificar.
     * @param id              identificador del cliente que se está editando.
     * @return {@code true} si otro cliente ya lo usa.
     */
    boolean existsByNumeroDocumentoAndIdNot(String numeroDocumento, Long id);

    /**
     * Lista los clientes según su estado, ordenados por nombres y apellidos.
     *
     * @param activo {@code true} para activos, {@code false} para inactivos.
     * @return lista ordenada.
     */
    List<Cliente> findByActivoOrderByNombresAscApellidosAsc(Boolean activo);

    /**
     * Busca el cliente asociado a un usuario del sistema.
     *
     * @param usuarioId id del usuario.
     * @return el cliente, si existe.
     */
    Optional<Cliente> findByUsuarioId(Integer usuarioId);

    /**
     * Indica si ya hay un cliente asociado a ese usuario.
     *
     * @param usuarioId id del usuario.
     * @return {@code true} si ya está asociado.
     */
    boolean existsByUsuarioId(Integer usuarioId);
}
