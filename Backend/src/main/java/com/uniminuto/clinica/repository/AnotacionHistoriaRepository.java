package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.AnotacionHistoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de acceso a datos de la entidad {@link AnotacionHistoria}.
 */
@Repository
public interface AnotacionHistoriaRepository extends JpaRepository<AnotacionHistoria, Long> {

    /**
     * Lista las anotaciones de una historia clinica ordenadas por fecha de
     * forma descendente (de la mas reciente a la mas antigua).
     *
     * @param historiaId identificador de la historia clinica.
     * @return anotaciones de la historia ordenadas por fecha descendente.
     */
    List<AnotacionHistoria> findByHistoriaIdOrderByFechaDesc(Integer historiaId);

    /**
     * Cuenta cuantas anotaciones tiene una historia clinica.
     *
     * @param historiaId identificador de la historia clinica.
     * @return numero de anotaciones de la historia.
     */
    long countByHistoriaId(Integer historiaId);
}
