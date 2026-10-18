package com.uniminuto.clinica.util;

/**
 * Utilidades de texto compartidas por servicios, DTO y especificaciones.
 */
public final class TextoUtil {

    /** Constructor privado: clase de utilidades que no se instancia. */
    private TextoUtil() {
    }

    /**
     * Indica si un texto es nulo o está compuesto solo por espacios.
     *
     * @param texto texto a evaluar
     * @return {@code true} si es nulo o vacío tras quitar espacios
     */
    public static boolean estaVacio(String texto) {
        return texto == null || texto.trim().isEmpty();
    }

    /**
     * Une nombres y apellidos en un solo texto.
     *
     * @param nombres   nombres de la persona
     * @param apellidos apellidos de la persona
     * @return nombre completo, por ejemplo {@code "Juan Pérez López"}
     */
    public static String nombreCompleto(String nombres, String apellidos) {
        return ((nombres == null ? "" : nombres) + " " + (apellidos == null ? "" : apellidos)).trim();
    }

    /**
     * Construye un patrón para búsquedas LIKE sin distinguir mayúsculas.
     *
     * @param texto texto buscado por el usuario
     * @return patrón en minúsculas rodeado de comodines, por ejemplo {@code "%max%"}
     */
    public static String patronLike(String texto) {
        return "%" + texto.trim().toLowerCase() + "%";
    }
}
