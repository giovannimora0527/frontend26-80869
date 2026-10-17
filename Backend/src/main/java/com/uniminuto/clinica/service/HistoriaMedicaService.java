package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.HistoriaMedicaRQ;
import com.uniminuto.clinica.models.HistoriaMedicaRS;
import com.uniminuto.clinica.exception.BadRequestException;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Contrato de negocio (CRUD) para la entidad HistoriaMedica.
 */
public interface HistoriaMedicaService {

    /**
     * Lista todas las historias clinicas ordenadas por fecha de creacion de la
     * mas reciente a la mas antigua.
     *
     * @return listado de historias.
     * @throws BadRequestException si ocurre un error de negocio.
     */
    List<HistoriaMedicaRS> listarTodas() throws BadRequestException;

    /**
     * Lista las historias medicas cuya fechaCreacion este entre fechaInicial y
     * fechaFinal, ordenadas de la mas reciente a la mas antigua.
     *
     * @param fechaInicial inicio del rango.
     * @param fechaFinal   fin del rango.
     * @return historias dentro del rango.
     * @throws BadRequestException si las fechas son invalidas.
     */
    List<HistoriaMedicaRS> listar(LocalDateTime fechaInicial, LocalDateTime fechaFinal) throws BadRequestException;

    /**
     * Obtiene una historia medica por su identificador.
     *
     * @param id identificador de la historia.
     * @return historia encontrada.
     * @throws BadRequestException si la historia no existe.
     */
    HistoriaMedicaRS obtenerPorId(Long id) throws BadRequestException;

    /**
     * Crea una nueva historia medica asociada a una mascota existente.
     *
     * @param request datos de la historia.
     * @return historia creada.
     * @throws BadRequestException si no se cumple alguna regla de negocio.
     */
    HistoriaMedicaRS crear(HistoriaMedicaRQ request) throws BadRequestException;

    /**
     * Actualiza una historia medica existente.
     *
     * @param request datos de la historia.
     * @return historia actualizada.
     * @throws BadRequestException si no se cumple alguna regla de negocio.
     */
    HistoriaMedicaRS actualizar(HistoriaMedicaRQ request) throws BadRequestException;

    /**
     * Elimina una historia medica por su identificador.
     *
     * @param id identificador de la historia.
     * @throws BadRequestException si la historia no existe.
     */
    void eliminar(Long id) throws BadRequestException;
}
