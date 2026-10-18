package com.uniminuto.clinica;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada del backend del centro veterinario (Spring Boot).
 */
@SpringBootApplication
public class ClinicaApplication {

    /**
     * Arranca la aplicación.
     *
     * @param args argumentos de línea de comandos
     */
    public static void main(String[] args) {
        SpringApplication.run(ClinicaApplication.class, args);
    }
}
