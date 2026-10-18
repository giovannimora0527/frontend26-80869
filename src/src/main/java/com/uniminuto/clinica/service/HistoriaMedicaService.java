package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.HistoriaMedica;
import com.uniminuto.clinica.models.HistoriaMedicaRq;
import com.uniminuto.clinica.models.HistoriaResumenRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.HistoriaFiltro;

import java.util.List;

/**
 * Operaciones y reglas de negocio de las historias clínicas.
 */
public interface HistoriaMedicaService {

    /**
     * Lista todas las historias ordenadas por fecha de consulta descendente (sin paginar).
     *
     * @return historias, las más recientes primero
     */
    List<HistoriaMedica> listarHistorias();

    /**
     * Lista las historias de forma resumida, con filtros, paginación y ordenamiento.
     * Por defecto ordena por fecha y hora de la consulta descendente.
     *
     * @param filtro filtros y parámetros de paginación
     * @return página de historias resumidas
     */
    PaginaRs<HistoriaResumenRs> listarHistoriasPaginado(HistoriaFiltro filtro);

    /**
     * Consulta el detalle completo de una historia clínica.
     *
     * @param id identificador de la historia
     * @return historia encontrada
     * @throws com.uniminuto.clinica.exception.ResourceNotFoundException si no existe
     */
    HistoriaMedica consultarHistoria(Long id);

    /**
     * Crea la historia clínica de una cita atendida. Valida la relación cliente → mascota → cita,
     * que la cita esté Atendida y que no tenga ya una historia.
     *
     * @param rq datos de la historia
     * @return respuesta 201 con el identificador de la historia creada
     */
    MiRespuestaRS crearHistoria(HistoriaMedicaRq rq);

    /**
     * Cierra una historia clínica; una historia cerrada no admite nuevas anotaciones.
     *
     * @param id identificador de la historia
     * @return respuesta 200 con el identificador de la historia
     */
    MiRespuestaRS cerrarHistoria(Long id);
}
