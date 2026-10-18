package com.uniminuto.clinica.enums;

/**
 * Estados de una historia clínica.
 *
 * <p>Una historia {@link #ABIERTA} admite nuevas anotaciones; una historia
 * {@link #CERRADA} queda como registro histórico y no admite más cambios.</p>
 */
public enum EstadoHistoria {

    /** Historia en curso: permite agregar y editar anotaciones. */
    ABIERTA("Abierta"),

    /** Historia finalizada: solo lectura. */
    CERRADA("Cerrada");

    /** Texto con el que el estado se almacena y se muestra al usuario. */
    private final String etiqueta;

    /**
     * Crea un estado con su etiqueta legible.
     *
     * @param etiqueta texto que se almacena en base de datos y se muestra en pantalla
     */
    EstadoHistoria(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    /**
     * Obtiene la etiqueta legible del estado.
     *
     * @return etiqueta del estado, por ejemplo {@code "Abierta"}
     */
    public String getEtiqueta() {
        return etiqueta;
    }

    /**
     * Indica si el texto dado corresponde a este estado, ignorando mayúsculas.
     *
     * @param texto estado almacenado, puede ser {@code null}
     * @return {@code true} si el texto coincide con la etiqueta de este estado
     */
    public boolean coincideCon(String texto) {
        return texto != null && etiqueta.equalsIgnoreCase(texto.trim());
    }
}
