package com.uniminuto.clinica.specification;

import com.uniminuto.clinica.entity.AnotacionHistoria;
import com.uniminuto.clinica.models.filtro.AnotacionFiltro;
import com.uniminuto.clinica.util.TextoUtil;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Construye la consulta dinámica del histórico de anotaciones a partir de {@link AnotacionFiltro}.
 */
public final class AnotacionHistoriaSpecification {

    /** Constructor privado: clase de utilidades que no se instancia. */
    private AnotacionHistoriaSpecification() {
    }

    /**
     * Crea la especificación que combina con AND todos los filtros informados.
     *
     * @param filtro filtros enviados por el cliente
     * @return especificación lista para usar con el repositorio
     */
    public static Specification<AnotacionHistoria> desdeFiltro(AnotacionFiltro filtro) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();

            if (filtro.getHistoriaId() != null) {
                predicados.add(cb.equal(root.get("historia").get("id"), filtro.getHistoriaId()));
            }
            if (filtro.getMascotaId() != null) {
                predicados.add(cb.equal(root.get("historia").get("mascota").get("mascotaId"), filtro.getMascotaId()));
            }
            if (filtro.getMedicoId() != null) {
                predicados.add(cb.equal(root.get("medico").get("id"), filtro.getMedicoId()));
            }
            PredicadosUtil.agregarRangoFechas(predicados, cb, root.<LocalDateTime>get("fecha"),
                    filtro.getFechaDesde(), filtro.getFechaHasta());

            if (!TextoUtil.estaVacio(filtro.getTexto())) {
                String patron = TextoUtil.patronLike(filtro.getTexto());
                predicados.add(cb.or(
                        cb.like(cb.lower(root.<String>get("descripcion")), patron),
                        cb.like(cb.lower(root.<String>get("observacion")), patron),
                        cb.like(cb.lower(root.<String>get("diagnostico")), patron),
                        cb.like(cb.lower(root.get("medico").<String>get("nombres")), patron),
                        cb.like(cb.lower(root.get("medico").<String>get("apellidos")), patron)));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
