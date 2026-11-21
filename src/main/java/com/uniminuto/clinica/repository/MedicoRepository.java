package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Medico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicoRepository extends JpaRepository<Medico, Long> {

    @Query("""
            SELECT m FROM Medico m
            WHERE m.estado = true
              AND NOT EXISTS (
                SELECT c.id FROM Cita c
                WHERE c.medico = m
                  AND c.estado = :estado
                  AND c.fechaHora BETWEEN :fechaInicio AND :fechaFin
            )
            """)
    List<Medico> findDisponiblesPorFecha(@Param("fechaInicio") LocalDateTime fechaInicio,
                                        @Param("fechaFin") LocalDateTime fechaFin,
                                        @Param("estado") String estado);

    boolean existsByNumeroDocumento(String numeroDocumento);

    boolean existsByRegistroProfesional(String registroProfesional);

    boolean existsByNumeroDocumentoAndIdNot(String numeroDocumento, Long id);

    boolean existsByRegistroProfesionalAndIdNot(String registroProfesional, Long id);

    /**
     * Busca el médico asociado a un usuario del sistema.
     *
     * @param usuarioId id del usuario.
     * @return el médico, si existe.
     */
    Optional<Medico> findByUsuarioId(Long usuarioId);

    /**
     * Indica si ya hay un médico asociado a ese usuario.
     *
     * @param usuarioId id del usuario.
     * @return {@code true} si ya está asociado.
     */
    boolean existsByUsuarioId(Long usuarioId);
}
