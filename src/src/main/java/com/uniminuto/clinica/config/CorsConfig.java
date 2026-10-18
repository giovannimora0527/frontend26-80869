package com.uniminuto.clinica.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración global de CORS. Reemplaza las anotaciones {@code @CrossOrigin}
 * dispersas por controlador, que usaban orígenes distintos y no permitían PATCH.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    /** Patrones de origen permitidos; configurable con {@code clinica.cors.allowed-origins}. */
    private final String[] origenesPermitidos;

    /**
     * Crea la configuración leyendo los orígenes permitidos de las propiedades.
     *
     * @param origenesPermitidos patrones de origen separados por coma
     */
    public CorsConfig(@Value("${clinica.cors.allowed-origins:http://localhost:*,http://127.0.0.1:*}")
                      String[] origenesPermitidos) {
        this.origenesPermitidos = origenesPermitidos;
    }

    /**
     * Registra la política CORS para todos los endpoints.
     *
     * @param registry registro de mapeos CORS de Spring MVC
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(origenesPermitidos)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
