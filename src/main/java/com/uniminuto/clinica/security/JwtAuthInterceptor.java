package com.uniminuto.clinica.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Exige un JWT valido (header Authorization: Bearer ...) en los endpoints protegidos.
 * <p>
 * Si el token es valido deja en la peticion el id y el perfil (rol) del usuario como
 * atributos ({@link #ATTR_USUARIO_ID} y {@link #ATTR_ROL}) para que los controladores no
 * tengan que confiar en datos enviados por el cliente. Ademas aplica dos reglas de acceso
 * por perfil: {@code /usuario/**} y {@code /cuenta/asociar-persona} son solo del administrador,
 * y el perfil Cliente (el que reciben quienes se registran solos) solo puede usar {@code /cuenta/**}.
 */
@Component
public class JwtAuthInterceptor implements HandlerInterceptor {

    /** Nombre del atributo con el id del usuario de la sesion. */
    public static final String ATTR_USUARIO_ID = "usuarioId";

    /** Nombre del atributo con el perfil (rol) del usuario de la sesion. */
    public static final String ATTR_ROL = "rol";

    private static final int ROL_ADMINISTRADOR = 1;
    private static final int ROL_CLIENTE = 4;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {
        // Las peticiones previas de CORS (OPTIONS) no llevan token.
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7).trim();
            if (jwtUtil.esValido(token)) {
                Integer rol = jwtUtil.obtenerRol(token);
                request.setAttribute(ATTR_USUARIO_ID, jwtUtil.obtenerUsuarioId(token));
                request.setAttribute(ATTR_ROL, rol);

                String ruta = request.getRequestURI().substring(request.getContextPath().length());
                if (tieneAcceso(rol, ruta)) {
                    return true;
                }
                responder(response, HttpServletResponse.SC_FORBIDDEN, "FORBIDDEN",
                        "No tienes permiso para realizar esta operación.");
                return false;
            }
        }
        responder(response, HttpServletResponse.SC_UNAUTHORIZED, "UNAUTHORIZED",
                "Sesión no válida o vencida. Inicia sesión de nuevo.");
        return false;
    }

    /**
     * Decide si un perfil puede entrar a una ruta.
     *
     * @param rol  perfil del usuario (viene firmado dentro del token).
     * @param ruta ruta pedida, sin el contexto de la aplicacion.
     * @return {@code true} si tiene acceso.
     */
    private boolean tieneAcceso(Integer rol, String ruta) {
        if (rol == null) {
            return false;
        }
        boolean rutaDeAdministrador = ruta.equals("/usuario") || ruta.startsWith("/usuario/")
                || ruta.equals("/cuenta/asociar-persona");
        if (rutaDeAdministrador) {
            return rol == ROL_ADMINISTRADOR;
        }
        if (rol == ROL_CLIENTE) {
            return ruta.startsWith("/cuenta/");
        }
        return true;
    }

    /** Escribe una respuesta de error JSON con el mismo formato del resto de la API. */
    private void responder(HttpServletResponse response, int status, String error, String mensaje)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"status\":" + status + ",\"error\":\"" + error
                + "\",\"message\":\"" + mensaje + "\"}");
    }
}
