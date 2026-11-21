package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.RecuperacionClave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Acceso a datos de la tabla {@code recuperacion_clave}.
 */
@Repository
public interface RecuperacionClaveRepository extends JpaRepository<RecuperacionClave, Long> {

    /**
     * Devuelve el código más reciente que todavía no se ha usado.
     *
     * @param usuarioId usuario dueño del código.
     * @return el código vigente, si existe.
     */
    Optional<RecuperacionClave> findTopByUsuarioIdAndUsadoFalseOrderByFechaCreacionDesc(Long usuarioId);

    /**
     * Devuelve todos los códigos sin usar de un usuario (para invalidarlos).
     *
     * @param usuarioId usuario dueño de los códigos.
     * @return lista de códigos sin usar.
     */
    List<RecuperacionClave> findByUsuarioIdAndUsadoFalse(Long usuarioId);
}
