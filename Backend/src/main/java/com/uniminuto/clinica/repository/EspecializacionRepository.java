package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Especializacion;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repositorio JPA para la entidad (link Especializacion)
 * Provee las operaciones CRUD básicas heredadas de (JpaRepository).
 */
public interface EspecializacionRepository extends JpaRepository<Especializacion, Long> {
}