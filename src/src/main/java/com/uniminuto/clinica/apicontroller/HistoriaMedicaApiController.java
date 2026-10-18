package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.HistoriaMedicaApi;
import com.uniminuto.clinica.entity.HistoriaMedica;
import com.uniminuto.clinica.models.HistoriaMedicaRq;
import com.uniminuto.clinica.models.HistoriaResumenRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.HistoriaFiltro;
import com.uniminuto.clinica.service.HistoriaMedicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de historias clínicas. Solo traduce HTTP ↔ servicio.
 */
@RestController
@RequestMapping("/historia-medica")
public class HistoriaMedicaApiController implements HistoriaMedicaApi {

    /** Servicio con la lógica de negocio de las historias clínicas. */
    @Autowired
    private HistoriaMedicaService historiaMedicaService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<HistoriaMedica>> listarHistorias() {
        return ResponseEntity.ok(historiaMedicaService.listarHistorias());
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<PaginaRs<HistoriaResumenRs>> listarHistoriasPaginado(HistoriaFiltro filtro) {
        return ResponseEntity.ok(historiaMedicaService.listarHistoriasPaginado(filtro));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<HistoriaMedica> consultarHistoria(Long id) {
        return ResponseEntity.ok(historiaMedicaService.consultarHistoria(id));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> crearHistoria(HistoriaMedicaRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(historiaMedicaService.crearHistoria(rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> cerrarHistoria(Long id) {
        return ResponseEntity.ok(historiaMedicaService.cerrarHistoria(id));
    }
}
