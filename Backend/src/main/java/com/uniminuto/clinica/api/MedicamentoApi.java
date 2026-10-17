package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.exception.BadRequestException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

/**
 * Contrato REST para la consulta de medicamentos.
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/medicamento")
public interface MedicamentoApi {

    /**
     * Lista los medicamentos disponibles ordenados por nombre.
     *
     * @return listado de medicamentos.
     * @throws BadRequestException excepcion de negocio.
     */
    @GetMapping(value = "/listar", produces = {"application/json"})
    ResponseEntity<List<Medicamento>> listarMedicamentos() throws BadRequestException;
}
