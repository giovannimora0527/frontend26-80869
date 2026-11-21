package com.uniminuto.clinica.utils;

import java.util.Locale;
import java.util.Set;

/**
 * Utilidades para dejar los textos escritos por las personas con un formato limpio.
 */
public final class TextoUtil {

    /** Palabras que van en minúscula dentro de un nombre (de, del, la...). */
    private static final Set<String> PARTICULAS = Set.of("de", "del", "la", "las", "los", "y", "e");

    private TextoUtil() {
    }

    /**
     * Deja un nombre o apellido con formato "Nombre Propio" cuando la persona lo escribió
     * todo en mayúsculas (ej. {@code "JUAN DE LA CRUZ"} pasa a {@code "Juan de la Cruz"}).
     * Si el texto ya trae minúsculas se respeta tal cual, solo se limpian los espacios.
     *
     * @param texto texto escrito por la persona (puede ser {@code null}).
     * @return texto limpio, o {@code null} si viene vacío.
     */
    public static String nombrePropio(String texto) {
        if (texto == null) {
            return null;
        }
        String limpio = texto.trim().replaceAll("\\s+", " ");
        if (limpio.isEmpty()) {
            return null;
        }
        if (!limpio.equals(limpio.toUpperCase(Locale.ROOT))) {
            return limpio;
        }
        String[] palabras = limpio.toLowerCase(Locale.ROOT).split(" ");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < palabras.length; i++) {
            String p = palabras[i];
            if (i > 0) {
                sb.append(' ');
            }
            if (i > 0 && PARTICULAS.contains(p)) {
                sb.append(p);
            } else {
                sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1));
            }
        }
        return sb.toString();
    }
}
