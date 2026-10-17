package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.HistoriaMedicaApi;
import com.uniminuto.clinica.models.HistoriaMedicaRQ;
import com.uniminuto.clinica.models.HistoriaMedicaRS;
import com.uniminuto.clinica.service.HistoriaMedicaService;
import com.uniminuto.clinica.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;


@RestController
public class HistoriaMedicaApiController implements HistoriaMedicaApi {


    @Autowired
    private HistoriaMedicaService historiaMedicaService;


    @Override
    public ResponseEntity<List<HistoriaMedicaRS>> listarHistorias(LocalDateTime fechaInicial, LocalDateTime fechaFinal) throws BadRequestException {
        return ResponseEntity.ok(historiaMedicaService.listar(fechaInicial, fechaFinal));
    }

    @Override
    public ResponseEntity<List<HistoriaMedicaRS>> listarTodas() throws BadRequestException {
        return ResponseEntity.ok(historiaMedicaService.listarTodas());
    }


    @Override
    public ResponseEntity<HistoriaMedicaRS> obtenerPorId(Long id) throws BadRequestException {
        return ResponseEntity.ok(historiaMedicaService.obtenerPorId(id));
    }


    @Override
    public ResponseEntity<HistoriaMedicaRS> guardarHistoria(HistoriaMedicaRQ request) throws BadRequestException {
        return ResponseEntity.ok(historiaMedicaService.crear(request));
    }


    @Override
    public ResponseEntity<HistoriaMedicaRS> actualizarHistoria(HistoriaMedicaRQ request) throws BadRequestException {
        return ResponseEntity.ok(historiaMedicaService.actualizar(request));
    }


    @Override
    public ResponseEntity<Void> eliminar(Long id) throws BadRequestException {
        historiaMedicaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}