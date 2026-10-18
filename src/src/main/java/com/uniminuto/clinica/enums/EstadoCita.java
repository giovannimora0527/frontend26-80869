package com.uniminuto.clinica.enums;

import com.uniminuto.clinica.exception.BadRequestException;

import java.util.Arrays;
import java.util.List;

/**
 * Estados posibles de una cita médica.
 *
 * <p>Reglas de transición (decisión de diseño):</p>
 * <ul>
 *   <li>{@link #PENDIENTE}, {@link #PROGRAMADA} y {@link #CONFIRMADA} son estados
 *       <b>activos</b>: la cita puede editarse y pasar a cualquier otro estado.</li>
 *   <li>{@link #ATENDIDA} es un estado <b>final</b>: conserva la información histórica
 *       y no admite ningún cambio posterior.</li>
 *   <li>{@link #CANCELADA} solo puede volver a estar activa mediante la operación
 *       explícita de reactivación, nunca por una edición normal.</li>
 * </ul>
 */
public enum EstadoCita {

    /** Cita registrada que aún no ha sido programada ni confirmada. */
    PENDIENTE("Pendiente"),

    /** Cita confirmada por el cliente o por la clínica. */
    CONFIRMADA("Confirmada"),

    /** Cita ya realizada; estado final e inmodificable. */
    ATENDIDA("Atendida"),

    /** Cita cancelada; libera la agenda del veterinario y de la mascota. */
    CANCELADA("Cancelada"),

    /** Cita programada en la agenda. */
    PROGRAMADA("Programada");

    /** Texto con el que el estado se almacena y se muestra al usuario. */
    private final String etiqueta;

    /**
     * Crea un estado con su etiqueta legible.
     *
     * @param etiqueta texto que se almacena en base de datos y se muestra en pantalla
     */
    EstadoCita(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    /**
     * Obtiene la etiqueta legible del estado.
     *
     * @return etiqueta del estado, por ejemplo {@code "Pendiente"}
     */
    public String getEtiqueta() {
        return etiqueta;
    }

    /**
     * Indica si la cita todavía ocupa la agenda y puede gestionarse.
     *
     * @return {@code true} si el estado es Pendiente, Programada o Confirmada
     */
    public boolean esActiva() {
        return this == PENDIENTE || this == PROGRAMADA || this == CONFIRMADA;
    }

    /**
     * Indica si es válido pasar de este estado a otro mediante una edición normal.
     *
     * @param destino estado al que se quiere pasar
     * @return {@code true} si la transición está permitida
     */
    public boolean puedePasarA(EstadoCita destino) {
        return esActiva() && destino != null && destino != this;
    }

    /**
     * Convierte un texto en un estado, ignorando mayúsculas y espacios.
     *
     * @param texto texto recibido del cliente, por ejemplo {@code "pendiente"}
     * @return estado correspondiente
     * @throws BadRequestException si el texto es vacío o no corresponde a un estado válido
     */
    public static EstadoCita desdeTexto(String texto) {
        if (texto == null || texto.trim().isEmpty()) {
            throw new BadRequestException("El estado de la cita es obligatorio");
        }
        String buscado = texto.trim();
        for (EstadoCita estado : values()) {
            if (estado.etiqueta.equalsIgnoreCase(buscado)) {
                return estado;
            }
        }
        throw new BadRequestException("El estado '" + texto + "' no es válido. Estados permitidos: "
                + String.join(", ", etiquetas()));
    }

    /**
     * Lista las etiquetas de todos los estados, útil para llenar combos en el frontend.
     *
     * @return etiquetas de los estados en el orden de declaración
     */
    public static List<String> etiquetas() {
        return Arrays.stream(values()).map(EstadoCita::getEtiqueta).toList();
    }
}
