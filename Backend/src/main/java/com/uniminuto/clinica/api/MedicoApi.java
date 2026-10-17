package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.MedicoConEspecializacionRS;
import com.uniminuto.clinica.exception.BadRequestException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;


@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/medico")
public interface MedicoApi {


    @GetMapping(value = "/listar-especializaciones", produces = {"application/json"})
    ResponseEntity<List<MedicoConEspecializacionRS>> listarConEspecializacion() throws BadRequestException;
}
