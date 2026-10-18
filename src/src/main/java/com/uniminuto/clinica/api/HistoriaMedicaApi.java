package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.HistoriaMedica;
import com.uniminuto.clinica.models.HistoriaMedicaRq;
import com.uniminuto.clinica.models.HistoriaResumenRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.HistoriaFiltro;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

/**
 * Contrato REST de historias clínicas. Ruta base: {@code /historia-medica}.
 */
public interface HistoriaMedicaApi {

    /**
     * {@code GET /historia-medica/listar}: lista todas las historias (fecha descendente), sin paginar.
     *
     * @return 200 con la lista de historias
     */
    @GetMapping("/listar")
    ResponseEntity<List<HistoriaMedica>> listarHistorias();

    /**
     * {@code GET /historia-medica/paginado}: listado resumido para el DataTable. Parámetros opcionales:
     * {@code page, size, sortBy, sortDir, texto, estado, clienteId, mascotaId, medicoId, citaId, fechaDesde, fechaHasta}.
     *
     * @param filtro filtros y paginación enlazados desde la query string
     * @return 200 con la página de historias resumidas, o 400 si algún parámetro no es válido
     */
    @GetMapping("/paginado")
    ResponseEntity<PaginaRs<HistoriaResumenRs>> listarHistoriasPaginado(@ModelAttribute HistoriaFiltro filtro);

    /**
     * {@code GET /historia-medica/consultar/{id}}: detalle completo de una historia.
     *
     * @param id identificador de la historia
     * @return 200 con la historia, o 404 si no existe
     */
    @GetMapping("/consultar/{id}")
    ResponseEntity<HistoriaMedica> consultarHistoria(@PathVariable("id") Long id);

    /**
     * {@code POST /historia-medica/guardar}: crea la historia clínica de una cita atendida.
     *
     * @param rq datos de la historia
     * @return 201 con el resultado, 400 por datos inválidos o 409 si la cita no está atendida o ya tiene historia
     */
    @PostMapping("/guardar")
    ResponseEntity<MiRespuestaRS> crearHistoria(@RequestBody HistoriaMedicaRq rq);

    /**
     * {@code PATCH /historia-medica/cerrar/{id}}: cierra una historia clínica.
     *
     * @param id identificador de la historia
     * @return 200 con el resultado, 404 si no existe, 409 si ya está cerrada
     */
    @PatchMapping("/cerrar/{id}")
    ResponseEntity<MiRespuestaRS> cerrarHistoria(@PathVariable("id") Long id);
}
