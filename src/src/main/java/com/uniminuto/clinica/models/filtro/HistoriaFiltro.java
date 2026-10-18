package com.uniminuto.clinica.models.filtro;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * Filtros del listado de historias clínicas. Todos son opcionales y se combinan con AND.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class HistoriaFiltro extends PaginacionFiltro {

    /** Texto libre: busca en mascota, cliente, veterinario, motivo y diagnóstico. */
    private String texto;

    /** Estado de la historia (Abierta o Cerrada). */
    private String estado;

    /** Identificador del cliente. */
    private Long clienteId;

    /** Identificador de la mascota. */
    private Integer mascotaId;

    /** Identificador del veterinario. */
    private Long medicoId;

    /** Identificador de la cita que originó la historia. */
    private Long citaId;

    /** Fecha mínima de la consulta, incluida (yyyy-MM-dd). */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaDesde;

    /** Fecha máxima de la consulta, incluida (yyyy-MM-dd). */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaHasta;
}
