package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.HistoriaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Acceso a datos de historias clínicas. Soporta consultas dinámicas con
 * {@link JpaSpecificationExecutor}.
 */
@Repository
public interface HistoriaMedicaRepository extends JpaRepository<HistoriaMedica, Long>,
        JpaSpecificationExecutor<HistoriaMedica> {

    /**
     * Lista todas las historias, las consultas más recientes primero.
     *
     * @return historias ordenadas por fecha de consulta descendente
     */
    List<HistoriaMedica> findAllByOrderByFechaCreacionDesc();

    /**
     * Busca la historia clínica generada por una cita.
     *
     * @param citaId identificador de la cita
     * @return historia de la cita, o vacío si aún no tiene
     */
    @Query("SELECT h FROM HistoriaMedica h WHERE h.cita.id = :citaId")
    Optional<HistoriaMedica> findByCitaId(@Param("citaId") Long citaId);
}
