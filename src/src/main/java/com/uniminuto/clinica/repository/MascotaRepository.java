package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Raza;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Acceso a datos de mascotas.
 */
@Repository
public interface MascotaRepository extends JpaRepository<Mascota, Integer> {

    /**
     * Lista todas las mascotas ordenadas por nombre.
     *
     * @return mascotas ordenadas alfabéticamente
     */
    List<Mascota> findAllByOrderByNombreMascotaAsc();

    /**
     * Busca mascotas cuyo nombre contenga el texto indicado, sin distinguir mayúsculas.
     *
     * @param nombre fragmento del nombre
     * @return mascotas que coinciden, ordenadas por nombre
     */
    List<Mascota> findByNombreMascotaContainingIgnoreCaseOrderByNombreMascotaAsc(String nombre);

    /**
     * Lista las mascotas de un cliente.
     *
     * @param cliente propietario
     * @return mascotas del cliente ordenadas por nombre
     */
    List<Mascota> findByClienteOrderByNombreMascotaAsc(Cliente cliente);

    /**
     * Lista las mascotas de una raza.
     *
     * @param raza raza buscada
     * @return mascotas de la raza ordenadas por nombre
     */
    List<Mascota> findByRazaOrderByNombreMascotaAsc(Raza raza);
}
