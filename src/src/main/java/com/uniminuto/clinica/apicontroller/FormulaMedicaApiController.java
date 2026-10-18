package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.FormulaMedicaApi;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.models.FormulaMedicaRq;
import com.uniminuto.clinica.models.FormulaResumenRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.FormulaFiltro;
import com.uniminuto.clinica.service.FormulaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de fórmulas médicas. Solo traduce HTTP ↔ servicio.
 */
@RestController
@RequestMapping("/formula-medica")
public class FormulaMedicaApiController implements FormulaMedicaApi {

    /** Servicio con la lógica de negocio de las fórmulas. */
    @Autowired
    private FormulaService formulaService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<FormulaMedica>> listarFormulas() {
        return ResponseEntity.ok(formulaService.listarFormulas());
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<PaginaRs<FormulaResumenRs>> listarFormulasPaginado(FormulaFiltro filtro) {
        return ResponseEntity.ok(formulaService.listarFormulasPaginado(filtro));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<FormulaMedica> consultarFormula(Long id) {
        return ResponseEntity.ok(formulaService.consultarFormula(id));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> crearFormula(FormulaMedicaRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(formulaService.crearFormula(rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> actualizarFormula(Long id, FormulaMedicaRq rq) {
        return ResponseEntity.ok(formulaService.actualizarFormula(id, rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> inactivarFormula(Long id) {
        return ResponseEntity.ok(formulaService.inactivarFormula(id));
    }
}
