package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.MedicamentoApi;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.service.MedicamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de consulta de medicamentos. Solo traduce HTTP ↔ servicio.
 */
@RestController
@RequestMapping("/medicamento")
public class MedicamentoApiController implements MedicamentoApi {

    /** Servicio de consulta de medicamentos. */
    @Autowired
    private MedicamentoService medicamentoService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<Medicamento>> listarMedicamentos() {
        return ResponseEntity.ok(medicamentoService.listarMedicamentos());
    }
}
