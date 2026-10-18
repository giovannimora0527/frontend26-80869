package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.RazaRq;

import java.util.List;

/**
 * Operaciones sobre las razas de mascotas.
 */
public interface RazaService {

    /**
     * Lista todas las razas ordenadas por especie y nombre.
     *
     * @return razas registradas
     */
    List<Raza> listarRazas();

    /**
     * Registra una raza nueva; no se permite repetir la misma raza dentro de una especie.
     *
     * @param razaRq datos de la raza
     * @return respuesta 201 con el resultado
     */
    MiRespuestaRS crearRazaNueva(RazaRq razaRq);
}
