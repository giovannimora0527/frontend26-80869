package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.ClinicaApi;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.service.ClinicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador REST de verificación del servicio.
 */
@RestController
@RequestMapping("/clinica")
public class ClinicaApiController implements ClinicaApi {

    /** Servicio de verificación. */
    @Autowired
    private ClinicaService clinicaService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<String> testService() {
        return ResponseEntity.ok(clinicaService.testService());
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<String> testService2() {
        return ResponseEntity.ok(clinicaService.testService2());
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> testService3() {
        return ResponseEntity.ok(clinicaService.testService3());
    }
}
