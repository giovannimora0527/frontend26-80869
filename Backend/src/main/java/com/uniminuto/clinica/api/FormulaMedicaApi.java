package com.uniminuto.clinica.api;

import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.FormulaMedicaRS;
import com.uniminuto.clinica.models.FormulaMedicaRq;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrato REST para la gestion de formulas medicas (recetas).
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/formula-medica")
public interface FormulaMedicaApi {

    /**
     * Lista todas las formulas medicas ordenadas por fecha de creacion
     * descendente (mas recientes primero).
     *
     * @return listado resumido de formulas.
     * @throws BadRequestException excepcion de negocio.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<List<FormulaMedicaRS>> listarFormulas() throws BadRequestException;

    /**
     * Obtiene el detalle completo de una formula por su identificador.
     *
     * @param id identificador de la formula.
     * @return detalle de la formula.
     * @throws BadRequestException si la formula no existe.
     */
    @GetMapping(value = "/obtener/{id}", produces = {"application/json"})
    ResponseEntity<FormulaMedicaRS> obtenerFormula(@PathVariable("id") Long id) throws BadRequestException;

    /**
     * Crea una nueva formula medica.
     *
     * @param request datos de la formula.
     * @return formula creada.
     * @throws BadRequestException si no se cumple alguna regla de negocio.
     */
    @PostMapping(value = "/crear", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<FormulaMedicaRS> crearFormula(@RequestBody FormulaMedicaRq request) throws BadRequestException;

    /**
     * Actualiza una formula medica existente.
     *
     * @param request datos de la formula.
     * @return formula actualizada.
     * @throws BadRequestException si no se cumple alguna regla de negocio.
     */
    @PutMapping(value = "/actualizar", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<FormulaMedicaRS> actualizarFormula(@RequestBody FormulaMedicaRq request) throws BadRequestException;
}
