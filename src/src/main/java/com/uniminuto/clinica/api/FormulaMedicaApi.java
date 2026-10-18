package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.models.FormulaMedicaRq;
import com.uniminuto.clinica.models.FormulaResumenRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.FormulaFiltro;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

/**
 * Contrato REST de fórmulas médicas. Ruta base: {@code /formula-medica}.
 */
public interface FormulaMedicaApi {

    /**
     * {@code GET /formula-medica/listar}: lista todas las fórmulas (más recientes primero), sin paginar.
     *
     * @return 200 con la lista de fórmulas
     */
    @GetMapping("/listar")
    ResponseEntity<List<FormulaMedica>> listarFormulas();

    /**
     * {@code GET /formula-medica/paginado}: listado resumido para el DataTable. Parámetros opcionales:
     * {@code page, size, sortBy, sortDir, texto, activo, clienteId, mascotaId, medicoId, medicamentoId, citaId,
     * fechaDesde, fechaHasta}.
     *
     * @param filtro filtros y paginación enlazados desde la query string
     * @return 200 con la página de fórmulas resumidas, o 400 si algún parámetro no es válido
     */
    @GetMapping("/paginado")
    ResponseEntity<PaginaRs<FormulaResumenRs>> listarFormulasPaginado(@ModelAttribute FormulaFiltro filtro);

    /**
     * {@code GET /formula-medica/consultar/{id}}: detalle completo de una fórmula.
     *
     * @param id identificador de la fórmula
     * @return 200 con la fórmula, o 404 si no existe
     */
    @GetMapping("/consultar/{id}")
    ResponseEntity<FormulaMedica> consultarFormula(@PathVariable("id") Long id);

    /**
     * {@code POST /formula-medica/guardar}: registra una fórmula nueva.
     *
     * @param rq datos de la fórmula
     * @return 201 con el resultado, 400 por datos inválidos o 409 si la cita está cancelada o la receta está duplicada
     */
    @PostMapping("/guardar")
    ResponseEntity<MiRespuestaRS> crearFormula(@RequestBody FormulaMedicaRq rq);

    /**
     * {@code PUT /formula-medica/actualizar/{id}}: edita dosis, frecuencia, duración e indicaciones.
     *
     * @param id identificador de la fórmula
     * @param rq nuevos datos
     * @return 200 con el resultado, 404 si no existe, 409 si está inactiva
     */
    @PutMapping("/actualizar/{id}")
    ResponseEntity<MiRespuestaRS> actualizarFormula(@PathVariable("id") Long id, @RequestBody FormulaMedicaRq rq);

    /**
     * {@code PATCH /formula-medica/inactivar/{id}}: inactiva una fórmula (no se elimina físicamente).
     *
     * @param id identificador de la fórmula
     * @return 200 con el resultado, 404 si no existe, 409 si ya está inactiva
     */
    @PatchMapping("/inactivar/{id}")
    ResponseEntity<MiRespuestaRS> inactivarFormula(@PathVariable("id") Long id);
}
