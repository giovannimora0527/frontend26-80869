package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.FormulaMedicaApi;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.FormulaMedicaRS;
import com.uniminuto.clinica.models.FormulaMedicaRq;
import com.uniminuto.clinica.service.FormulaMedicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST que expone los servicios de formulas medicas y delega la
 * logica de negocio al {@link FormulaMedicaService}.
 */
@RestController
public class FormulaMedicaApiController implements FormulaMedicaApi {

    @Autowired
    private FormulaMedicaService formulaMedicaService;

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<List<FormulaMedicaRS>> listarFormulas() throws BadRequestException {
        return ResponseEntity.ok(this.formulaMedicaService.listar());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<FormulaMedicaRS> obtenerFormula(Long id) throws BadRequestException {
        return ResponseEntity.ok(this.formulaMedicaService.obtenerPorId(id));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<FormulaMedicaRS> crearFormula(FormulaMedicaRq request) throws BadRequestException {
        return ResponseEntity.ok(this.formulaMedicaService.crear(request));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public ResponseEntity<FormulaMedicaRS> actualizarFormula(FormulaMedicaRq request) throws BadRequestException {
        return ResponseEntity.ok(this.formulaMedicaService.actualizar(request));
    }
}
