package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.CitaApi;
import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.models.CitaResumenRs;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.CitaFiltro;
import com.uniminuto.clinica.service.CitaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de citas médicas. Solo traduce HTTP ↔ servicio: las reglas viven en
 * {@link CitaService} y los errores los traduce {@code GlobalExceptionHandler}.
 */
@RestController
@RequestMapping("/cita")
public class CitaApiController implements CitaApi {

    /** Servicio con la lógica de negocio de las citas. */
    @Autowired
    private CitaService citaService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<Cita>> listarCitas() {
        return ResponseEntity.ok(citaService.listarCitas());
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<PaginaRs<CitaResumenRs>> listarCitasPaginado(CitaFiltro filtro) {
        return ResponseEntity.ok(citaService.listarCitasPaginado(filtro));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<Cita> consultarCita(Long id) {
        return ResponseEntity.ok(citaService.consultarCita(id));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> crearCita(CitaRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(citaService.crearCita(rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> actualizarCita(Long id, CitaRq rq) {
        return ResponseEntity.ok(citaService.actualizarCita(id, rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> cancelarCita(Long id) {
        return ResponseEntity.ok(citaService.cancelarCita(id));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> reactivarCita(Long id) {
        return ResponseEntity.ok(citaService.reactivarCita(id));
    }
}
