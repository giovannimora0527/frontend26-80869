package com.uniminuto.clinica.specification;

import com.uniminuto.clinica.exception.BadRequestException;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Predicados reutilizables por las especificaciones de los listados.
 */
final class PredicadosUtil {

    /** Constructor privado: clase de utilidades que no se instancia. */
    private PredicadosUtil() {
    }

    /**
     * Agrega las condiciones "desde" y "hasta" (ambas inclusivas, por día) sobre un campo de fecha y hora.
     *
     * @param predicados lista a la que se agregan las condiciones
     * @param cb         constructor de criterios
     * @param campo      campo de tipo fecha y hora sobre el que se filtra
     * @param desde      fecha mínima, o {@code null}
     * @param hasta      fecha máxima, o {@code null}
     * @throws BadRequestException si la fecha inicial es posterior a la final
     */
    static void agregarRangoFechas(List<Predicate> predicados, CriteriaBuilder cb,
                                   Path<LocalDateTime> campo, LocalDate desde, LocalDate hasta) {
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new BadRequestException("La fecha inicial no puede ser posterior a la fecha final");
        }
        if (desde != null) {
            predicados.add(cb.greaterThanOrEqualTo(campo, desde.atStartOfDay()));
        }
        if (hasta != null) {
            predicados.add(cb.lessThan(campo, hasta.plusDays(1).atStartOfDay()));
        }
    }
}
