package com.uniminuto.clinica.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private JwtAuthInterceptor jwtAuthInterceptor;

    /** Poner en false (application.properties) para desactivar la validacion del JWT. */
    @Value("${app.jwt.proteger-endpoints:true}")
    private boolean protegerEndpoints;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        if (protegerEndpoints) {
            registry.addInterceptor(jwtAuthInterceptor)
                    .addPathPatterns("/**")
                    .excludePathPatterns(
                            "/auth/**",
                            "/cuenta/registro",
                            "/cuenta/olvide-contrasena",
                            "/cuenta/restablecer-contrasena",
                            "/clinica/test",
                            "/clinica/test2",
                            "/clinica/test3",
                            "/error");
        }
    }
}
