package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.MiRespuestaRS;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Contrato REST de verificación del servicio. Ruta base: {@code /clinica}.
 */
public interface ClinicaApi {

    /**
     * {@code GET /clinica/test}: comprueba que el backend responde.
     *
     * @return 200 con un mensaje de confirmación
     */
    @GetMapping("/test")
    ResponseEntity<String> testService();

    /**
     * {@code GET /clinica/test2}: segunda comprobación del servicio.
     *
     * @return 200 con un mensaje de confirmación
     */
    @GetMapping("/test2")
    ResponseEntity<String> testService2();

    /**
     * {@code GET /clinica/test3}: comprobación con respuesta estructurada.
     *
     * @return 200 con la respuesta estándar
     */
    @GetMapping("/test3")
    ResponseEntity<MiRespuestaRS> testService3();
}
