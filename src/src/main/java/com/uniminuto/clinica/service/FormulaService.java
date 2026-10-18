package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.models.FormulaMedicaRq;
import com.uniminuto.clinica.models.FormulaResumenRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.FormulaFiltro;

import java.util.List;

/**
 * Operaciones y reglas de negocio de las fórmulas médicas.
 */
public interface FormulaService {

    /**
     * Lista todas las fórmulas, las más recientes primero (sin paginar).
     *
     * @return fórmulas ordenadas por fecha de creación descendente
     */
    List<FormulaMedica> listarFormulas();

    /**
     * Lista las fórmulas de forma resumida con filtros, paginación y ordenamiento. Por defecto
     * ordena por fecha de creación descendente.
     *
     * @param filtro filtros y parámetros de paginación
     * @return página de fórmulas resumidas
     */
    PaginaRs<FormulaResumenRs> listarFormulasPaginado(FormulaFiltro filtro);

    /**
     * Consulta el detalle completo de una fórmula.
     *
     * @param id identificador de la fórmula
     * @return fórmula encontrada
     * @throws com.uniminuto.clinica.exception.ResourceNotFoundException si no existe
     */
    FormulaMedica consultarFormula(Long id);

    /**
     * Registra una fórmula nueva validando mascota, cliente, veterinario, cita, fechas, dosis y duración.
     *
     * @param rq datos de la fórmula
     * @return respuesta 201 con el identificador de la fórmula creada
     */
    MiRespuestaRS crearFormula(FormulaMedicaRq rq);

    /**
     * Edita los datos que las reglas de negocio permiten modificar (dosis, frecuencia, duración e indicaciones).
     *
     * @param id identificador de la fórmula
     * @param rq nuevos datos
     * @return respuesta 200 con el identificador de la fórmula
     */
    MiRespuestaRS actualizarFormula(Long id, FormulaMedicaRq rq);

    /**
     * Inactiva una fórmula (eliminación lógica): conserva el registro para no perder información clínica.
     *
     * @param id identificador de la fórmula
     * @return respuesta 200 con el identificador de la fórmula
     */
    MiRespuestaRS inactivarFormula(Long id);
}
