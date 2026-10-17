package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repositorio de acceso a datos de la entidad {@link Cita}.
 * Trabaja con identificadores planos (medicoId, mascotaId) en lugar de
 * relaciones JPA para mantener la coherencia con la entidad.
 */
@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {

    /**
     * Lista las citas cuyo campo fechaHora se encuentre dentro del rango dado.
     *
     * @param fechaInicio inicio del rango.
     * @param fechaFin    fin del rango.
     * @return listado de citas en el rango.
     */
    List<Cita> findByFechaHoraBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    /**
     * Devuelve todas las citas ordenadas por fecha y hora de forma descendente.
     *
     * @return citas ordenadas de la mas reciente a la mas antigua.
     */
    List<Cita> findAllByOrderByFechaHoraDesc();

    /**
     * Busca citas de un medico dentro de un rango de fechas. Se usa para
     * validar que un medico no tenga dos citas en el mismo horario.
     *
     * @param medicoId    identificador del medico.
     * @param fechaInicio inicio del rango.
     * @param fechaFin    fin del rango.
     * @return citas del medico dentro del rango.
     */
    List<Cita> findByMedicoIdAndFechaHoraBetween(Integer medicoId, LocalDateTime fechaInicio, LocalDateTime fechaFin);

    /**
     * Busca citas de una mascota dentro de un rango de fechas. Se usa para
     * validar que una mascota no tenga dos citas simultaneas.
     *
     * @param mascotaId   identificador de la mascota.
     * @param fechaInicio inicio del rango.
     * @param fechaFin    fin del rango.
     * @return citas de la mascota dentro del rango.
     */
    List<Cita> findByMascotaIdAndFechaHoraBetween(Integer mascotaId, LocalDateTime fechaInicio, LocalDateTime fechaFin);
}
