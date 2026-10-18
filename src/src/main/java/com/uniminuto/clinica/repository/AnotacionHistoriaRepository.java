package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.AnotacionHistoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acceso a datos de anotaciones de historias clínicas. Soporta consultas dinámicas con
 * {@link JpaSpecificationExecutor}.
 */
@Repository
public interface AnotacionHistoriaRepository extends JpaRepository<AnotacionHistoria, Long>,
        JpaSpecificationExecutor<AnotacionHistoria> {

    /**
     * Lista las anotaciones de una historia, de la más reciente a la más antigua.
     *
     * @param historiaId identificador de la historia clínica
     * @return anotaciones de la historia
     */
    @Query("SELECT a FROM AnotacionHistoria a WHERE a.historia.id = :historiaId ORDER BY a.fecha DESC, a.id DESC")
    List<AnotacionHistoria> findByHistoriaIdOrderByFechaDesc(@Param("historiaId") Long historiaId);
}
