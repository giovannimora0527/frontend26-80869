package com.uniminuto.clinica.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * JWT HS256 sencillo, sin librerias extra: header.payload.firma
 * (el JSON se arma a mano para no depender de la version de Jackson).
 */
@Component
public class JwtUtil {

    private static final String ALGORITMO = "HmacSHA256";
    private static final Pattern EXP = Pattern.compile("\"exp\"\\s*:\\s*(\\d+)");
    private static final Pattern UID = Pattern.compile("\"uid\"\\s*:\\s*(\\d+)");
    private static final Pattern ROL = Pattern.compile("\"rol\"\\s*:\\s*(\\d+)");

    @Value("${app.jwt.secret:ClinicaUniminutoSecretoJwt2026ClaveLargaParaFirmar}")
    private String secret;

    @Value("${app.jwt.expiracion-minutos:60}")
    private long expiracionMinutos;

    public long getExpiracionSegundos() {
        return expiracionMinutos * 60;
    }

    public String generarToken(Long usuarioId, String username, Integer rol) {
        long ahora = Instant.now().getEpochSecond();

        String header = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
        String payload = "{\"sub\":\"" + escapar(username) + "\""
                + ",\"uid\":" + usuarioId
                + ",\"rol\":" + rol
                + ",\"iat\":" + ahora
                + ",\"exp\":" + (ahora + getExpiracionSegundos()) + "}";

        String h = base64(header.getBytes(StandardCharsets.UTF_8));
        String p = base64(payload.getBytes(StandardCharsets.UTF_8));
        String firma = base64(firmar(h + "." + p));
        return h + "." + p + "." + firma;
    }

    /**
     * @return true si la firma es correcta y el token no ha vencido.
     */
    public boolean esValido(String token) {
        try {
            if (token == null) {
                return false;
            }
            String[] partes = token.split("\\.");
            if (partes.length != 3) {
                return false;
            }
            byte[] firmaEsperada = firmar(partes[0] + "." + partes[1]);
            byte[] firmaRecibida = Base64.getUrlDecoder().decode(partes[2]);
            if (!MessageDigest.isEqual(firmaEsperada, firmaRecibida)) {
                return false;
            }
            String payload = new String(Base64.getUrlDecoder().decode(partes[1]), StandardCharsets.UTF_8);
            Matcher m = EXP.matcher(payload);
            return m.find() && Long.parseLong(m.group(1)) >= Instant.now().getEpochSecond();
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * @return el id del usuario guardado en el token, o null si no es valido.
     */
    public Long obtenerUsuarioId(String token) {
        if (!esValido(token)) {
            return null;
        }
        String payload = new String(Base64.getUrlDecoder().decode(token.split("\\.")[1]),
                StandardCharsets.UTF_8);
        Matcher m = UID.matcher(payload);
        return m.find() ? Long.valueOf(m.group(1)) : null;
    }

    /**
     * @return el id del perfil (rol) guardado en el token, o null si no es valido.
     */
    public Integer obtenerRol(String token) {
        if (!esValido(token)) {
            return null;
        }
        String payload = new String(Base64.getUrlDecoder().decode(token.split("\\.")[1]),
                StandardCharsets.UTF_8);
        Matcher m = ROL.matcher(payload);
        return m.find() ? Integer.valueOf(m.group(1)) : null;
    }

    private byte[] firmar(String contenido) {
        try {
            Mac mac = Mac.getInstance(ALGORITMO);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), ALGORITMO));
            return mac.doFinal(contenido.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("No se pudo firmar el token", e);
        }
    }

    private String base64(byte[] datos) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(datos);
    }

    private String escapar(String texto) {
        return texto == null ? "" : texto.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
