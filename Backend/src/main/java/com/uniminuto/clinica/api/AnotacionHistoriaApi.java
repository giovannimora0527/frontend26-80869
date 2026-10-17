package com.uniminuto.clinica.api;

import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.AnotacionHistoriaRS;
import com.uniminuto.clinica.models.AnotacionHistoriaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrato REST para la gestion de anotaciones de historia clinica.
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/anotacion-historia")
public interface AnotacionHistoriaApi {

    /**
     * Crea una nueva anotacion dentro de una historia clinica.
     *
     * @param anotacionHistoria datos de la anotacion.
     * @return respuesta con el mensaje de exito.
     * @throws BadRequestException excepcion de negocio.
     */
    @PostMapping(value = "/crear",
            produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> crearAnotacionHistoria(
            @RequestBody AnotacionHistoriaRq anotacionHistoria
    ) throws BadRequestException;

    /**
     * Lista las anotaciones de una historia clinica ordenadas de la mas
     * reciente a la mas antigua.
     *
     * @param historiaId identificador de la historia clinica.
     * @return anotaciones de la historia.
     * @throws BadRequestException excepcion de negocio.
     */
    @GetMapping(value = "/listar/{historiaId}", produces = {"application/json"})
    ResponseEntity<List<AnotacionHistoriaRS>> listarPorHistoria(
            @PathVariable("historiaId") Integer historiaId
    ) throws BadRequestException;
}
