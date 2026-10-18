package com.uniminuto.clinica.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/**
 * Utilidades para comparar y mostrar fechas con precisión de minutos. Los formularios del
 * frontend envían fechas sin segundos, por eso "ahora" se compara truncado al minuto: así
 * una cita elegida para el minuto actual no se rechaza como pasada.
 */
public final class FechaUtil {

    /** Formato legible para los mensajes al usuario. */
    private static final DateTimeFormatter FORMATO_MENSAJE = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /** Constructor privado: clase de utilidades que no se instancia. */
    private FechaUtil() {
    }

    /**
     * Indica si una fecha y hora es anterior al minuto actual.
     *
     * @param fecha fecha a evaluar
     * @return {@code true} si ya pasó
     */
    public static boolean esPasada(LocalDateTime fecha) {
        return fecha.truncatedTo(ChronoUnit.MINUTES).isBefore(LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES));
    }

    /**
     * Indica si una fecha y hora es posterior al minuto actual.
     *
     * @param fecha fecha a evaluar
     * @return {@code true} si aún no ha ocurrido
     */
    public static boolean esFutura(LocalDateTime fecha) {
        return fecha.truncatedTo(ChronoUnit.MINUTES).isAfter(LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES));
    }

    /**
     * Indica si la primera fecha es anterior a la segunda, comparando al minuto.
     *
     * @param fecha      fecha a evaluar
     * @param referencia fecha de referencia
     * @return {@code true} si {@code fecha} es estrictamente anterior a {@code referencia}
     */
    public static boolean esAnterior(LocalDateTime fecha, LocalDateTime referencia) {
        return fecha.truncatedTo(ChronoUnit.MINUTES).isBefore(referencia.truncatedTo(ChronoUnit.MINUTES));
    }

    /**
     * Indica si dos fechas coinciden hasta el minuto.
     *
     * @param a primera fecha
     * @param b segunda fecha
     * @return {@code true} si ambas representan el mismo minuto
     */
    public static boolean mismoMinuto(LocalDateTime a, LocalDateTime b) {
        return a.truncatedTo(ChronoUnit.MINUTES).equals(b.truncatedTo(ChronoUnit.MINUTES));
    }

    /**
     * Da formato legible a una fecha para los mensajes al usuario.
     *
     * @param fecha fecha a formatear
     * @return texto con formato {@code dd/MM/yyyy HH:mm}
     */
    public static String formatear(LocalDateTime fecha) {
        return FORMATO_MENSAJE.format(fecha);
    }
}
