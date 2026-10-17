package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Medicamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositorio de acceso a datos de la entidad {@link Medicamento}.
 */
@Repository
public interface MedicamentoRepository extends JpaRepository<Medicamento, Long> {

    /**
     * Lista los medicamentos ordenados alfabeticamente por nombre.
     *
     * @return medicamentos ordenados por nombre ascendente.
     */
    List<Medicamento> findAllByOrderByNombreAsc();
}
