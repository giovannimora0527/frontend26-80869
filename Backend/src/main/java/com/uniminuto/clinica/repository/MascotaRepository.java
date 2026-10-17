package com.uniminuto.clinica.repository;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Raza;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MascotaRepository extends JpaRepository<Mascota, Integer> {

    List<Mascota> findAllByOrderByNombreMascotaAsc();

    List<Mascota> findAllByOrderByNombreMascotaDesc();

    Mascota findByNombreMascota(String nombreMascota);

    List<Mascota> findByClienteOrderByNombreMascotaAsc(Cliente c);

    List<Mascota> findByRazaOrderByNombreMascotaAsc(Raza raza);
}