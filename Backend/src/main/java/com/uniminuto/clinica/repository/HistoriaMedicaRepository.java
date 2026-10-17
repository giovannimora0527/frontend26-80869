package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.HistoriaMedica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repositorio de acceso a datos de la entidad {@link HistoriaMedica}.
 */
@Repository
public interface HistoriaMedicaRepository extends JpaRepository<HistoriaMedica, Long> {

    /**
     * Lista las historias cuya fecha de creacion este dentro del rango dado,
     * ordenadas de la mas reciente a la mas antigua.
     *
     * @param fechaInicial inicio del rango.
     * @param fechaFinal   fin del rango.
     * @return historias dentro del rango ordenadas por fecha descendente.
     */
    List<HistoriaMedica> findByFechaCreacionBetweenOrderByFechaCreacionDesc(
            LocalDateTime fechaInicial, LocalDateTime fechaFinal);

    /**
     * Devuelve todas las historias ordenadas por fecha de creacion descendente.
     *
     * @return historias ordenadas de la mas reciente a la mas antigua.
     */
    List<HistoriaMedica> findAllByOrderByFechaCreacionDesc();

    /**
     * Busca la historia clinica asociada a una mascota (paciente).
     *
     * @param pacienteId identificador de la mascota.
     * @return historias de la mascota.
     */
    List<HistoriaMedica> findByPacienteId(Integer pacienteId);
}
