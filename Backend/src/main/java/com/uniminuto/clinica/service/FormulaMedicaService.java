package com.uniminuto.clinica.service;

import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.FormulaMedicaRS;
import com.uniminuto.clinica.models.FormulaMedicaRq;

import java.util.List;

/**
 * Contrato de negocio para la gestion de formulas medicas (recetas).
 */
public interface FormulaMedicaService {

    /**
     * Lista todas las formulas medicas ordenadas por fecha de creacion de la
     * mas reciente a la mas antigua.
     *
     * @return listado de formulas.
     * @throws BadRequestException si ocurre un error de negocio.
     */
    List<FormulaMedicaRS> listar() throws BadRequestException;

    /**
     * Obtiene el detalle completo de una formula por su identificador.
     *
     * @param id identificador de la formula.
     * @return formula encontrada.
     * @throws BadRequestException si la formula no existe.
     */
    FormulaMedicaRS obtenerPorId(Long id) throws BadRequestException;

    /**
     * Crea una nueva formula medica aplicando las reglas de negocio.
     *
     * @param request datos de la formula a crear.
     * @return formula creada.
     * @throws BadRequestException si no se cumple alguna regla de negocio.
     */
    FormulaMedicaRS crear(FormulaMedicaRq request) throws BadRequestException;

    /**
     * Actualiza una formula medica existente.
     *
     * @param request datos de la formula a actualizar.
     * @return formula actualizada.
     * @throws BadRequestException si no se cumple alguna regla de negocio.
     */
    FormulaMedicaRS actualizar(FormulaMedicaRq request) throws BadRequestException;
}
