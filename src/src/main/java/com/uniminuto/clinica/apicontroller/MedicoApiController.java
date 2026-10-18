package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.MedicoApi;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.service.MedicoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de consulta de veterinarios. Solo traduce HTTP ↔ servicio.
 */
@RestController
@RequestMapping("/medico")
public class MedicoApiController implements MedicoApi {

    /** Servicio de consulta de veterinarios. */
    @Autowired
    private MedicoService medicoService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<Medico>> listarMedicos() {
        return ResponseEntity.ok(medicoService.listarMedicos());
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<Medico> consultarMedico(Long id) {
        return ResponseEntity.ok(medicoService.consultarMedico(id));
    }
}
