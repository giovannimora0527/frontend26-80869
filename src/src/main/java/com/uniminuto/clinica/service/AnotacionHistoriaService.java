package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.AnotacionHistoria;
import com.uniminuto.clinica.models.AnotacionHistoriaRq;
import com.uniminuto.clinica.models.AnotacionResumenRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.AnotacionFiltro;

import java.util.List;

/**
 * Operaciones y reglas de negocio de las anotaciones de las historias clínicas. Las anotaciones
 * son un registro histórico: solo se crean y se consultan, nunca se editan ni se eliminan.
 */
public interface AnotacionHistoriaService {

    /**
     * Lista todas las anotaciones de una historia, de la más reciente a la más antigua (sin paginar).
     *
     * @param historiaId identificador de la historia clínica
     * @return anotaciones de la historia
     * @throws com.uniminuto.clinica.exception.ResourceNotFoundException si la historia no existe
     */
    List<AnotacionHistoria> listarPorHistoria(Long historiaId);

    /**
     * Lista el histórico de anotaciones de forma resumida con filtros, paginación y ordenamiento.
     * Por defecto ordena por fecha descendente (de la más reciente a la más antigua).
     *
     * @param filtro filtros y parámetros de paginación
     * @return página de anotaciones resumidas
     */
    PaginaRs<AnotacionResumenRs> listarAnotacionesPaginado(AnotacionFiltro filtro);

    /**
     * Consulta el detalle completo de una anotación.
     *
     * @param id identificador de la anotación
     * @return anotación encontrada
     * @throws com.uniminuto.clinica.exception.ResourceNotFoundException si no existe
     */
    AnotacionHistoria consultarAnotacion(Long id);

    /**
     * Agrega una anotación a una historia clínica abierta.
     *
     * @param rq datos de la anotación
     * @return respuesta 201 con el identificador de la anotación creada
     */
    MiRespuestaRS crearAnotacion(AnotacionHistoriaRq rq);
}
