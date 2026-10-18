package com.uniminuto.clinica.models.filtro;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/**
 * Filtros del histórico de anotaciones. Todos son opcionales y se combinan con AND.
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class AnotacionFiltro extends PaginacionFiltro {

    /** Texto libre: busca en descripción, observación, diagnóstico y veterinario. */
    private String texto;

    /** Identificador de la historia clínica. */
    private Long historiaId;

    /** Identificador de la mascota (todas las anotaciones de sus historias). */
    private Integer mascotaId;

    /** Identificador del veterinario que registró la anotación. */
    private Long medicoId;

    /** Fecha mínima de la anotación, incluida (yyyy-MM-dd). */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaDesde;

    /** Fecha máxima de la anotación, incluida (yyyy-MM-dd). */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fechaHasta;
}
