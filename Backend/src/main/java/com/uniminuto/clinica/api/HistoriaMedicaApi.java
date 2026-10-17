package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.HistoriaMedicaRQ;
import com.uniminuto.clinica.models.HistoriaMedicaRS;
import com.uniminuto.clinica.exception.BadRequestException;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;


@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/historia-medica")
public interface HistoriaMedicaApi {


    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<List<HistoriaMedicaRS>> listarHistorias(
            @RequestParam("fechaInicial") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicial,
            @RequestParam("fechaFinal") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFinal
    ) throws BadRequestException;

    /**
     * Lista todas las historias clinicas ordenadas por fecha descendente, sin
     * requerir un rango de fechas.
     *
     * @return listado completo de historias.
     * @throws BadRequestException excepcion de negocio.
     */
    @GetMapping(value = "/listar-todas", produces = {"application/json"})
    ResponseEntity<List<HistoriaMedicaRS>> listarTodas() throws BadRequestException;

    /**
     * Pide el id
     */
    @GetMapping(value = "/obtener/{id}", produces = {"application/json"})
    ResponseEntity<HistoriaMedicaRS> obtenerPorId(@PathVariable("id") Long id) throws BadRequestException;


    @PostMapping(value = "/guardar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<HistoriaMedicaRS> guardarHistoria(@RequestBody HistoriaMedicaRQ request) throws BadRequestException;

    /**
     * pide el id
     */
    @PutMapping(value = "/actualizar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<HistoriaMedicaRS> actualizarHistoria(@RequestBody HistoriaMedicaRQ request) throws BadRequestException;

    /**
     * pide id
     */
    @DeleteMapping(value = "/eliminar/{id}")
    ResponseEntity<Void> eliminar(@PathVariable("id") Long id) throws BadRequestException;
}
