package com.uniminuto.clinica.models;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Datos recibidos para crear o editar una cita. La fecha y hora pueden enviarse juntas en
 * {@code fechaHora} o separadas en {@code fecha} y {@code hora} (como las captura el formulario).
 */
@Data
public class CitaRq {

    /** Cliente dueño de la mascota; obligatorio al crear. */
    private Long clienteId;

    /** Mascota que asiste a la cita; debe pertenecer al cliente. Obligatoria al crear. */
    private Integer mascotaId;

    /** Veterinario que atenderá la cita. */
    private Long medicoId;

    /** Fecha y hora completas de la cita (alternativa a {@code fecha} + {@code hora}). */
    private LocalDateTime fechaHora;

    /** Fecha de la cita (se usa junto con {@code hora}). */
    private LocalDate fecha;

    /** Hora de la cita (se usa junto con {@code fecha}). */
    private LocalTime hora;

    /** Motivo de la consulta. */
    private String motivo;

    /** Estado deseado de la cita; si se omite al crear, queda Pendiente. */
    private String estado;

    /**
     * Calcula la fecha y hora de la cita a partir de lo enviado.
     *
     * @return {@code fechaHora} si viene informada; si no, la combinación de {@code fecha} y
     *         {@code hora}; {@code null} si no hay datos suficientes
     */
    public LocalDateTime resolverFechaHora() {
        if (fechaHora != null) {
            return fechaHora;
        }
        if (fecha != null && hora != null) {
            return LocalDateTime.of(fecha, hora);
        }
        return null;
    }
}
