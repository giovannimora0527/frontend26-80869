package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.AnotacionHistoria;
import com.uniminuto.clinica.models.AnotacionHistoriaRq;
import com.uniminuto.clinica.models.AnotacionResumenRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.AnotacionFiltro;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

/**
 * Contrato REST de anotaciones de historias clínicas. Ruta base: {@code /anotacion-historia}.
 */
public interface AnotacionHistoriaApi {

    /**
     * {@code GET /anotacion-historia/listarPorHistoria/{historiaId}}: anotaciones de una historia
     * (más reciente primero), sin paginar.
     *
     * @param historiaId identificador de la historia clínica
     * @return 200 con las anotaciones, o 404 si la historia no existe
     */
    @GetMapping("/listarPorHistoria/{historiaId}")
    ResponseEntity<List<AnotacionHistoria>> listarPorHistoria(@PathVariable("historiaId") Long historiaId);

    /**
     * {@code GET /anotacion-historia/paginado}: histórico resumido para el DataTable. Parámetros opcionales:
     * {@code page, size, sortBy, sortDir, texto, historiaId, mascotaId, medicoId, fechaDesde, fechaHasta}.
     *
     * @param filtro filtros y paginación enlazados desde la query string
     * @return 200 con la página de anotaciones resumidas, o 400 si algún parámetro no es válido
     */
    @GetMapping("/paginado")
    ResponseEntity<PaginaRs<AnotacionResumenRs>> listarAnotacionesPaginado(@ModelAttribute AnotacionFiltro filtro);

    /**
     * {@code GET /anotacion-historia/consultar/{id}}: detalle completo de una anotación.
     *
     * @param id identificador de la anotación
     * @return 200 con la anotación, o 404 si no existe
     */
    @GetMapping("/consultar/{id}")
    ResponseEntity<AnotacionHistoria> consultarAnotacion(@PathVariable("id") Long id);

    /**
     * {@code POST /anotacion-historia/guardar}: agrega una anotación a una historia abierta.
     *
     * @param rq datos de la anotación
     * @return 201 con el resultado, 400 por datos inválidos o 409 si la historia está cerrada
     */
    @PostMapping("/guardar")
    ResponseEntity<MiRespuestaRS> crearAnotacion(@RequestBody AnotacionHistoriaRq rq);
}
