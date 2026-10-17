package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.AnotacionHistoriaApi;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.AnotacionHistoriaRS;
import com.uniminuto.clinica.models.AnotacionHistoriaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.service.AnotacionHistoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST que expone los servicios de anotaciones de historia clinica.
 */
@RestController
public class AnotacionHistoriaApiController implements AnotacionHistoriaApi {

    @Autowired
    private AnotacionHistoriaService anotacionHistoriaService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<MiRespuestaRS> crearAnotacionHistoria(AnotacionHistoriaRq anotacionHistoria)
            throws BadRequestException {
        return ResponseEntity.ok(anotacionHistoriaService.crearAnotacionHistoria(anotacionHistoria));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<AnotacionHistoriaRS>> listarPorHistoria(Integer historiaId)
            throws BadRequestException {
        return ResponseEntity.ok(anotacionHistoriaService.listarPorHistoria(historiaId));
    }
}
