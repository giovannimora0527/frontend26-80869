package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.AnotacionHistoriaApi;
import com.uniminuto.clinica.entity.AnotacionHistoria;
import com.uniminuto.clinica.models.AnotacionHistoriaRq;
import com.uniminuto.clinica.models.AnotacionResumenRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.AnotacionFiltro;
import com.uniminuto.clinica.service.AnotacionHistoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de anotaciones de historias clínicas. Solo traduce HTTP ↔ servicio.
 */
@RestController
@RequestMapping("/anotacion-historia")
public class AnotacionHistoriaApiController implements AnotacionHistoriaApi {

    /** Servicio con la lógica de negocio de las anotaciones. */
    @Autowired
    private AnotacionHistoriaService anotacionService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<AnotacionHistoria>> listarPorHistoria(Long historiaId) {
        return ResponseEntity.ok(anotacionService.listarPorHistoria(historiaId));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<PaginaRs<AnotacionResumenRs>> listarAnotacionesPaginado(AnotacionFiltro filtro) {
        return ResponseEntity.ok(anotacionService.listarAnotacionesPaginado(filtro));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<AnotacionHistoria> consultarAnotacion(Long id) {
        return ResponseEntity.ok(anotacionService.consultarAnotacion(id));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> crearAnotacion(AnotacionHistoriaRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(anotacionService.crearAnotacion(rq));
    }
}
