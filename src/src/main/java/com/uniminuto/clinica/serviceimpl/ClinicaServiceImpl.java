package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.service.ClinicaService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Implementación del servicio de verificación del backend.
 */
@Service
public class ClinicaServiceImpl implements ClinicaService {

    /**
     * {@inheritDoc}
     */
    @Override
    public String testService() {
        return "Servicio funcionando correctamente";
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String testService2() {
        return "Test 2 ejecutado correctamente";
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public MiRespuestaRS testService3() {
        return MiRespuestaRS.of(HttpStatus.OK.value(), "Test 3 ejecutado correctamente");
    }
}
