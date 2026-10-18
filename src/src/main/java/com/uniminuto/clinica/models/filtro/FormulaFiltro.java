package com.uniminuto.clinica.models.filtro;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * Filtros del listado de fórmulas médicas. Todos son opcionales y se combinan con AND.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class FormulaFiltro extends PaginacionFiltro {

    /** Texto libre: busca en mascota, cliente, veterinario, medicamento, dosis y frecuencia. */
    private String texto;

    /** {@code true} solo activas, {@code false} solo inactivas, nulo todas. */
    private Boolean activo;

    /** Identificador del cliente propietario de la mascota. */
    private Long clienteId;

    /** Identificador de la mascota. */
    private Integer mascotaId;

    /** Identificador del veterinario que emitió la fórmula. */
    private Long medicoId;

    /** Identificador del medicamento. */
    private Long medicamentoId;

    /** Identificador de la cita (consulta). */
    private Long citaId;

    /** Fecha mínima de creación, incluida (yyyy-MM-dd). */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaDesde;

    /** Fecha máxima de creación, incluida (yyyy-MM-dd). */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaHasta;
}
