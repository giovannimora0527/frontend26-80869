package com.uniminuto.clinica.service;

import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.RazaRq;

import java.util.List;

public interface RazaService {

    MiRespuestaRS crearRazaNueva(RazaRq razaRq) throws BadRequestException;

    List<Raza> listarRazas() throws BadRequestException;
}
