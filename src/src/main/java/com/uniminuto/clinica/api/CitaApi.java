package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.models.CitaResumenRs;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.CitaFiltro;
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
 * Contrato REST de citas médicas. Ruta base: {@code /cita}.
 */
public interface CitaApi {

    /**
     * {@code GET /cita/listar}: lista todas las citas (fecha y hora descendente), sin paginar.
     *
     * @return 200 con la lista de citas
     */
    @GetMapping("/listar")
    ResponseEntity<List<Cita>> listarCitas();

    /**
     * {@code GET /cita/paginado}: listado resumido para el DataTable. Parámetros opcionales:
     * {@code page, size, sortBy, sortDir, texto, estado, clienteId, mascotaId, medicoId, fechaDesde, fechaHasta}.
     *
     * @param filtro filtros y paginación enlazados desde la query string
     * @return 200 con la página de citas resumidas, o 400 si algún parámetro no es válido
     */
    @GetMapping("/paginado")
    ResponseEntity<PaginaRs<CitaResumenRs>> listarCitasPaginado(@ModelAttribute CitaFiltro filtro);

    /**
     * {@code GET /cita/consultar/{id}}: detalle de una cita.
     *
     * @param id identificador de la cita
     * @return 200 con la cita, o 404 si no existe
     */
    @GetMapping("/consultar/{id}")
    ResponseEntity<Cita> consultarCita(@PathVariable("id") Long id);

    /**
     * {@code POST /cita/guardar}: registra una cita nueva.
     *
     * @param rq datos de la cita
     * @return 201 con el resultado, 400 por datos inválidos o 409 si el horario no está disponible
     */
    @PostMapping("/guardar")
    ResponseEntity<MiRespuestaRS> crearCita(@RequestBody CitaRq rq);

    /**
     * {@code PUT /cita/actualizar/{id}}: edita una cita activa.
     *
     * @param id identificador de la cita
     * @param rq nuevos datos
     * @return 200 con el resultado, 404 si no existe, 409 si está atendida, cancelada o el horario no está libre
     */
    @PutMapping("/actualizar/{id}")
    ResponseEntity<MiRespuestaRS> actualizarCita(@PathVariable("id") Long id, @RequestBody CitaRq rq);

    /**
     * {@code PATCH /cita/cancelar/{id}}: cancela una cita activa (no se elimina físicamente).
     *
     * @param id identificador de la cita
     * @return 200 con el resultado, 404 si no existe, 409 si está atendida o ya cancelada
     */
    @PatchMapping("/cancelar/{id}")
    ResponseEntity<MiRespuestaRS> cancelarCita(@PathVariable("id") Long id);

    /**
     * {@code PATCH /cita/reactivar/{id}}: reactiva una cita cancelada (operación explícita).
     *
     * @param id identificador de la cita
     * @return 200 con el resultado, 404 si no existe, 409 si no está cancelada, ya pasó o el horario no está libre
     */
    @PatchMapping("/reactivar/{id}")
    ResponseEntity<MiRespuestaRS> reactivarCita(@PathVariable("id") Long id);
}
