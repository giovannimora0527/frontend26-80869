package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Raza;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Acceso a datos de razas.
 */
@Repository
public interface RazaRepository extends JpaRepository<Raza, Integer> {

    /**
     * Busca una raza por especie y nombre exactos.
     *
     * @param especie especie de la raza
     * @param nombre  nombre de la raza
     * @return raza encontrada, o vacío si no existe
     */
    Optional<Raza> findByEspecieAndNombre(String especie, String nombre);
}
