package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Medico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acceso a datos de veterinarios.
 */
@Repository
public interface MedicoRepository extends JpaRepository<Medico, Long> {

    /**
     * Lista los veterinarios ordenados alfabéticamente por apellidos y luego por nombres.
     *
     * @return veterinarios ordenados
     */
    List<Medico> findAllByOrderByApellidosAscNombresAsc();
}
