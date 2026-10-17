package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.MedicoApi;
import com.uniminuto.clinica.models.MedicoConEspecializacionRS;
import com.uniminuto.clinica.service.MedicoService;
import com.uniminuto.clinica.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * recibe las peticiones HTTP y delega
 * la lógica de negocio al servicio
 */
@RestController
public class MedicoApiController implements MedicoApi {


    @Autowired
    private MedicoService medicoService;


    @Override
    public ResponseEntity<List<MedicoConEspecializacionRS>> listarConEspecializacion() throws BadRequestException {
        return ResponseEntity.ok(medicoService.listarConEspecializacion());
    }
}