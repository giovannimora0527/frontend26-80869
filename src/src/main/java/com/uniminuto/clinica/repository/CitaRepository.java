package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Acceso a datos de citas. Soporta consultas dinámicas (filtros, paginación y orden)
 * mediante {@link JpaSpecificationExecutor}.
 */
@Repository
public interface CitaRepository extends JpaRepository<Cita, Long>, JpaSpecificationExecutor<Cita> {

    /**
     * Lista todas las citas, las más recientes primero.
     *
     * @return citas ordenadas por fecha y hora descendente
     */
    List<Cita> findAllByOrderByFechaHoraDesc();

    /**
     * Indica si un veterinario ya tiene una cita vigente (no cancelada) dentro de un rango.
     *
     * @param medicoId identificador del veterinario
     * @param inicio   inicio del rango, incluido
     * @param fin      fin del rango, incluido
     * @param excluirId cita que se ignora (la que se está editando); use 0 si no aplica
     * @return {@code true} si existe al menos una cita que choca con el rango
     */
    @Query("SELECT COUNT(c) > 0 FROM Cita c WHERE c.medico.id = :medicoId "
            + "AND c.fechaHora BETWEEN :inicio AND :fin "
            + "AND LOWER(c.estado) <> 'cancelada' AND c.id <> :excluirId")
    boolean existeCitaVigenteDelMedico(@Param("medicoId") Long medicoId,
                                       @Param("inicio") LocalDateTime inicio,
                                       @Param("fin") LocalDateTime fin,
                                       @Param("excluirId") Long excluirId);

    /**
     * Indica si una mascota ya tiene una cita vigente (no cancelada) dentro de un rango.
     *
     * @param mascotaId identificador de la mascota
     * @param inicio    inicio del rango, incluido
     * @param fin       fin del rango, incluido
     * @param excluirId cita que se ignora (la que se está editando); use 0 si no aplica
     * @return {@code true} si existe al menos una cita que choca con el rango
     */
    @Query("SELECT COUNT(c) > 0 FROM Cita c WHERE c.mascota.mascotaId = :mascotaId "
            + "AND c.fechaHora BETWEEN :inicio AND :fin "
            + "AND LOWER(c.estado) <> 'cancelada' AND c.id <> :excluirId")
    boolean existeCitaVigenteDeLaMascota(@Param("mascotaId") Integer mascotaId,
                                         @Param("inicio") LocalDateTime inicio,
                                         @Param("fin") LocalDateTime fin,
                                         @Param("excluirId") Long excluirId);

    /**
     * Indica si una mascota tiene alguna cita registrada (de cualquier estado).
     *
     * @param mascotaId identificador de la mascota
     * @return {@code true} si la mascota ya tiene citas
     */
    @Query("SELECT COUNT(c) > 0 FROM Cita c WHERE c.mascota.mascotaId = :mascotaId")
    boolean existeCitaDeLaMascota(@Param("mascotaId") Integer mascotaId);
}
