package com.uniminuto.clinica.models;

import lombok.Data;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * Respuesta paginada genérica para alimentar un DataTable del frontend.
 *
 * @param <T> tipo de los elementos de la página
 */
@Data
public class PaginaRs<T> {

    /** Elementos de la página solicitada. */
    private List<T> content;

    /** Número de la página actual, iniciando en 0. */
    private int page;

    /** Tamaño de página solicitado. */
    private int size;

    /** Total de registros que cumplen los filtros (en todas las páginas). */
    private long totalElements;

    /** Total de páginas disponibles. */
    private int totalPages;

    /**
     * Convierte una página de entidades en una página de DTOs.
     *
     * @param pagina   página de entidades devuelta por el repositorio
     * @param mapeador función que transforma cada entidad en su DTO
     * @param <E>      tipo de la entidad
     * @param <T>      tipo del DTO
     * @return página con los DTO y la información de paginación
     */
    public static <E, T> PaginaRs<T> desde(Page<E> pagina, Function<E, T> mapeador) {
        PaginaRs<T> respuesta = new PaginaRs<>();
        respuesta.setContent(pagina.getContent().stream().map(mapeador).toList());
        respuesta.setPage(pagina.getNumber());
        respuesta.setSize(pagina.getSize());
        respuesta.setTotalElements(pagina.getTotalElements());
        respuesta.setTotalPages(pagina.getTotalPages());
        return respuesta;
    }
}
