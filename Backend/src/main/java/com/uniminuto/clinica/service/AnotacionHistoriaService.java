package com.uniminuto.clinica.service;

import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.AnotacionHistoriaRS;
import com.uniminuto.clinica.models.AnotacionHistoriaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;

import java.util.List;

/**
 * Contrato de negocio para la gestion de anotaciones de historia clinica.
 */
public interface AnotacionHistoriaService {

    /**
     * Crea una nueva anotacion dentro de una historia clinica. Si la mascota
     * aun no tiene historia, el servicio la crea automaticamente.
     *
     * @param anotacionHistoriaRq datos de la anotacion.
     * @return respuesta con el mensaje de exito.
     * @throws BadRequestException si no se cumple alguna regla de negocio.
     */
    MiRespuestaRS crearAnotacionHistoria(AnotacionHistoriaRq anotacionHistoriaRq) throws BadRequestException;

    /**
     * Lista las anotaciones de una historia clinica ordenadas de la mas
     * reciente a la mas antigua.
     *
     * @param historiaId identificador de la historia clinica.
     * @return anotaciones de la historia.
     * @throws BadRequestException si el identificador es invalido.
     */
    List<AnotacionHistoriaRS> listarPorHistoria(Integer historiaId) throws BadRequestException;
}
