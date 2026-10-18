package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.MiRespuestaRS;

/**
 * Servicio de verificación (health check) del backend. Las operaciones clínicas viven en
 * sus propios servicios (citas, historias, anotaciones, fórmulas).
 */
public interface ClinicaService {

    /**
     * Prueba básica de que el servicio responde.
     *
     * @return mensaje de confirmación
     */
    String testService();

    /**
     * Segunda prueba del servicio.
     *
     * @return mensaje de confirmación
     */
    String testService2();

    /**
     * Prueba que devuelve una respuesta estructurada.
     *
     * @return respuesta con estado 200 y mensaje de confirmación
     */
    MiRespuestaRS testService3();
}
