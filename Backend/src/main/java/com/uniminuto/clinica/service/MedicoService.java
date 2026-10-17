package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.MedicoConEspecializacionRS;
import com.uniminuto.clinica.exception.BadRequestException;

import java.util.List;

public interface MedicoService {

    /**
     * Lista todos los médicos registrados junto con los datos de su
     * especialización
     */
    List<MedicoConEspecializacionRS> listarConEspecializacion() throws BadRequestException;
}