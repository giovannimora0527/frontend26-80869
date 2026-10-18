package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.RazaApi;
import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.RazaRq;
import com.uniminuto.clinica.service.RazaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de razas. Solo traduce HTTP ↔ servicio.
 */
@RestController
@RequestMapping("/raza")
public class RazaApiController implements RazaApi {

    /** Servicio con la lógica de negocio de las razas. */
    @Autowired
    private RazaService razaService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<Raza>> listarRazas() {
        return ResponseEntity.ok(razaService.listarRazas());
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> guardarRaza(RazaRq razaRq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(razaService.crearRazaNueva(razaRq));
    }
}
