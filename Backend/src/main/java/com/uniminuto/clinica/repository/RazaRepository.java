package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Raza;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RazaRepository extends JpaRepository<Raza, Integer> {

    Optional<Raza> findByNombre(String nombre);

    Optional<Raza> findByEspecieAndNombre(String especie, String nombre);

}