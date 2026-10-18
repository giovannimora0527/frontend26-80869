package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.CitaResumenRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.CitaFiltro;

import java.util.List;

/**
 * Operaciones y reglas de negocio de las citas médicas. El backend es el responsable de
 * validar las reglas críticas; el frontend solo las refleja para mejorar la experiencia.
 */
public interface CitaService {

    /**
     * Lista todas las citas, las más recientes primero (sin paginar).
     *
     * @return citas ordenadas por fecha y hora descendente
     */
    List<Cita> listarCitas();

    /**
     * Lista las citas de forma resumida con filtros, paginación y ordenamiento. Por defecto
     * ordena por fecha y hora descendente.
     *
     * @param filtro filtros y parámetros de paginación
     * @return página de citas resumidas
     */
    PaginaRs<CitaResumenRs> listarCitasPaginado(CitaFiltro filtro);

    /**
     * Consulta el detalle de una cita.
     *
     * @param id identificador de la cita
     * @return cita encontrada
     * @throws com.uniminuto.clinica.exception.ResourceNotFoundException si no existe
     */
    Cita consultarCita(Long id);

    /**
     * Registra una cita nueva validando cliente, mascota, veterinario, fecha y disponibilidad.
     *
     * @param rq datos de la cita
     * @return respuesta 201 con el identificador de la cita creada
     */
    MiRespuestaRS crearCita(CitaRq rq);

    /**
     * Edita una cita respetando su estado: solo las citas activas pueden cambiar de fecha,
     * hora, veterinario, motivo o estado.
     *
     * @param id identificador de la cita
     * @param rq nuevos datos de la cita
     * @return respuesta 200 con el identificador de la cita
     */
    MiRespuestaRS actualizarCita(Long id, CitaRq rq);

    /**
     * Cancela una cita activa (eliminación lógica: la cita se conserva con estado Cancelada).
     *
     * @param id identificador de la cita
     * @return respuesta 200 con el identificador de la cita
     */
    MiRespuestaRS cancelarCita(Long id);

    /**
     * Reactiva una cita cancelada. Es la operación explícita que permite volver a activarla;
     * revalida fecha y disponibilidad.
     *
     * @param id identificador de la cita
     * @return respuesta 200 con el identificador de la cita
     */
    MiRespuestaRS reactivarCita(Long id);
}
