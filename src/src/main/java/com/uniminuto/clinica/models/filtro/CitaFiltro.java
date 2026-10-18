package com.uniminuto.clinica.models.filtro;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * Filtros del listado de citas. Todos son opcionales y se combinan con AND.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class CitaFiltro extends PaginacionFiltro {

    /** Texto libre: busca en cliente, mascota, veterinario y motivo. */
    private String texto;

    /** Estado exacto de la cita (Pendiente, Confirmada, Atendida, Cancelada, Programada). */
    private String estado;

    /** Identificador del cliente. */
    private Long clienteId;

    /** Identificador de la mascota. */
    private Integer mascotaId;

    /** Identificador del veterinario. */
    private Long medicoId;

    /** Fecha mínima de la cita, incluida (yyyy-MM-dd). */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaDesde;

    /** Fecha máxima de la cita, incluida (yyyy-MM-dd). */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaHasta;
}
