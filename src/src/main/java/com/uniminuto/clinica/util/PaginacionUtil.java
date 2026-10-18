package com.uniminuto.clinica.util;

import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.filtro.PaginacionFiltro;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Map;

/**
 * Construye el {@link Pageable} de un listado a partir de los parámetros del cliente.
 * Solo permite ordenar por las columnas declaradas en una lista blanca, evitando que un
 * nombre de campo arbitrario provoque errores o exponga el modelo interno.
 */
public final class PaginacionUtil {

    /** Tamaño de página por defecto. */
    public static final int TAMANO_POR_DEFECTO = 10;

    /** Tamaño máximo de página permitido. */
    public static final int TAMANO_MAXIMO = 100;

    /** Constructor privado: clase de utilidades que no se instancia. */
    private PaginacionUtil() {
    }

    /**
     * Valida los parámetros de paginación y arma la solicitud de página.
     *
     * @param filtro         parámetros enviados por el cliente
     * @param ordenables     clave pública de columna → propiedad de la entidad por la que se ordena
     * @param claveDefecto   clave de columna usada cuando el cliente no indica ninguna
     * @param direccionBase  dirección usada cuando el cliente no indica ninguna
     * @return solicitud de página con un orden estable (desempata por {@code id})
     * @throws BadRequestException si la página, el tamaño, la columna o la dirección no son válidos
     */
    public static Pageable construir(PaginacionFiltro filtro, Map<String, String> ordenables,
                                     String claveDefecto, Sort.Direction direccionBase) {
        int pagina = filtro.getPage() == null ? 0 : filtro.getPage();
        int tamano = filtro.getSize() == null ? TAMANO_POR_DEFECTO : filtro.getSize();
        if (pagina < 0) {
            throw new BadRequestException("El número de página no puede ser negativo");
        }
        if (tamano < 1 || tamano > TAMANO_MAXIMO) {
            throw new BadRequestException("El tamaño de página debe estar entre 1 y " + TAMANO_MAXIMO);
        }

        String clave = TextoUtil.estaVacio(filtro.getSortBy()) ? claveDefecto : filtro.getSortBy().trim();
        String propiedad = ordenables.get(clave);
        if (propiedad == null) {
            throw new BadRequestException("No se puede ordenar por '" + clave + "'. Columnas válidas: "
                    + String.join(", ", ordenables.keySet()));
        }

        Sort.Direction direccion = direccionBase;
        if (!TextoUtil.estaVacio(filtro.getSortDir())) {
            String texto = filtro.getSortDir().trim();
            if ("asc".equalsIgnoreCase(texto)) {
                direccion = Sort.Direction.ASC;
            } else if ("desc".equalsIgnoreCase(texto)) {
                direccion = Sort.Direction.DESC;
            } else {
                throw new BadRequestException("La dirección de orden debe ser 'asc' o 'desc'");
            }
        }

        Sort orden = Sort.by(direccion, propiedad);
        if (!"id".equals(propiedad)) {
            orden = orden.and(Sort.by(Sort.Direction.DESC, "id"));
        }
        return PageRequest.of(pagina, tamano, orden);
    }
}
