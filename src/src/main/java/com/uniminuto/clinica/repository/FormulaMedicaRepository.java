package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.FormulaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acceso a datos de fórmulas médicas. Soporta consultas dinámicas con
 * {@link JpaSpecificationExecutor}.
 */
@Repository
public interface FormulaMedicaRepository extends JpaRepository<FormulaMedica, Long>,
        JpaSpecificationExecutor<FormulaMedica> {

    /**
     * Lista todas las fórmulas, las más recientes primero.
     *
     * @return fórmulas ordenadas por fecha de creación descendente
     */
    List<FormulaMedica> findAllByOrderByFechaCreacionRegistroDesc();

    /**
     * Indica si ya existe una fórmula activa del mismo medicamento para una cita
     * (evita registrar la misma receta dos veces).
     *
     * @param citaId        identificador de la cita
     * @param medicamentoId identificador del medicamento
     * @return {@code true} si ya existe una fórmula activa duplicada
     */
    @Query("SELECT COUNT(f) > 0 FROM FormulaMedica f WHERE f.cita.id = :citaId "
            + "AND f.medicamento.id = :medicamentoId AND f.activo = true")
    boolean existeFormulaActiva(@Param("citaId") Long citaId, @Param("medicamentoId") Long medicamentoId);
}
