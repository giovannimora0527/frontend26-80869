package com.uniminuto.clinica;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Prueba de arranque: verifica que el contexto de Spring carga, que las entidades se mapean
 * y que todas las consultas de los repositorios son válidas (usa H2 en memoria).
 */
@SpringBootTest
@ActiveProfiles("test")
class ClinicaApplicationTests {

    /** Si el contexto no puede iniciar (mapeos o consultas inválidas) la prueba falla. */
    @Test
    void contextLoads() {
    }
}
