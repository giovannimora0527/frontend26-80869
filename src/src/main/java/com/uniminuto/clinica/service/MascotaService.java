package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;

import java.util.List;

/**
 * Operaciones y reglas de negocio de las mascotas.
 */
public interface MascotaService {

    /**
     * Lista todas las mascotas ordenadas por nombre.
     *
     * @return mascotas ordenadas alfabéticamente
     */
    List<Mascota> listarMascotas();

    /**
     * Consulta una mascota por su identificador.
     *
     * @param id identificador de la mascota
     * @return mascota encontrada
     * @throws com.uniminuto.clinica.exception.ResourceNotFoundException si no existe
     */
    Mascota consultarMascota(Integer id);

    /**
     * Busca mascotas cuyo nombre contenga el texto indicado.
     *
     * @param nombre fragmento del nombre
     * @return mascotas que coinciden, ordenadas por nombre
     */
    List<Mascota> buscarMascotasPorNombre(String nombre);

    /**
     * Lista únicamente las mascotas de un cliente (usado por el combo dependiente Cliente → Mascota).
     *
     * @param clienteId identificador del cliente
     * @return mascotas del cliente ordenadas por nombre
     * @throws com.uniminuto.clinica.exception.ResourceNotFoundException si el cliente no existe
     */
    List<Mascota> buscarMascotasPorCliente(Long clienteId);

    /**
     * Lista las mascotas de una raza.
     *
     * @param razaId identificador de la raza
     * @return mascotas de la raza ordenadas por nombre
     * @throws com.uniminuto.clinica.exception.ResourceNotFoundException si la raza no existe
     */
    List<Mascota> buscarMascotasPorRaza(Integer razaId);

    /**
     * Registra una mascota nueva.
     *
     * @param rq datos de la mascota
     * @return respuesta 201 con el resultado
     */
    MiRespuestaRS guardarMascota(MascotaRq rq);

    /**
     * Actualiza los datos de una mascota. No permite cambiar de dueño si la mascota ya tiene citas.
     *
     * @param id identificador de la mascota
     * @param rq nuevos datos
     * @return respuesta 200 con el resultado
     */
    MiRespuestaRS actualizarMascota(Integer id, MascotaRq rq);
}
