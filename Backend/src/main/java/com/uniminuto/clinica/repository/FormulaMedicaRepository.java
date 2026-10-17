package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.FormulaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de acceso a datos de la entidad {@link FormulaMedica}.
 */
@Repository
public interface FormulaMedicaRepository extends JpaRepository<FormulaMedica, Long> {

    /**
     * Lista todas las formulas ordenadas por fecha de creacion de forma
     * descendente (de la mas reciente a la mas antigua).
     *
     * @return formulas ordenadas por fecha de creacion descendente.
     */
    List<FormulaMedica> findAllByOrderByFechaCreacionRegistroDesc();
}
