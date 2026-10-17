package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.service.ClinicaService;
import com.uniminuto.clinica.exception.BadRequestException;
import org.springframework.stereotype.Service;

@Service
public class ClinicaServiceImpl implements ClinicaService {

    @Override
    public String testService2() throws BadRequestException {
        return "Servicio ok";
    }

    @Override
    public MiRespuestaRS testService3() throws BadRequestException {
        MiRespuestaRS respuesta = new MiRespuestaRS();
        respuesta.setStatus(200);
        respuesta.setMessage("Servicio ok desde clase y objeto");
        return respuesta;
    }
}
