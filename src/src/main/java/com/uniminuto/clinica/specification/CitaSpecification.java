package com.uniminuto.clinica.specification;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.enums.EstadoCita;
import com.uniminuto.clinica.models.filtro.CitaFiltro;
import com.uniminuto.clinica.util.TextoUtil;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Construye la consulta dinámica del listado de citas a partir de {@link CitaFiltro}.
 */
public final class CitaSpecification {

    /** Constructor privado: clase de utilidades que no se instancia. */
    private CitaSpecification() {
    }

    /**
     * Crea la especificación que combina con AND todos los filtros informados.
     *
     * @param filtro filtros enviados por el cliente
     * @return especificación lista para usar con el repositorio
     */
    public static Specification<Cita> desdeFiltro(CitaFiltro filtro) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();

            if (filtro.getClienteId() != null) {
                predicados.add(cb.equal(root.get("cliente").get("id"), filtro.getClienteId()));
            }
            if (filtro.getMascotaId() != null) {
                predicados.add(cb.equal(root.get("mascota").get("mascotaId"), filtro.getMascotaId()));
            }
            if (filtro.getMedicoId() != null) {
                predicados.add(cb.equal(root.get("medico").get("id"), filtro.getMedicoId()));
            }
            if (!TextoUtil.estaVacio(filtro.getEstado())) {
                String estado = EstadoCita.desdeTexto(filtro.getEstado()).getEtiqueta().toLowerCase();
                predicados.add(cb.equal(cb.lower(root.<String>get("estado")), estado));
            }
            PredicadosUtil.agregarRangoFechas(predicados, cb, root.<LocalDateTime>get("fechaHora"),
                    filtro.getFechaDesde(), filtro.getFechaHasta());

            if (!TextoUtil.estaVacio(filtro.getTexto())) {
                String patron = TextoUtil.patronLike(filtro.getTexto());
                predicados.add(cb.or(
                        cb.like(cb.lower(root.get("cliente").<String>get("nombres")), patron),
                        cb.like(cb.lower(root.get("cliente").<String>get("apellidos")), patron),
                        cb.like(cb.lower(root.get("mascota").<String>get("nombreMascota")), patron),
                        cb.like(cb.lower(root.get("medico").<String>get("nombres")), patron),
                        cb.like(cb.lower(root.get("medico").<String>get("apellidos")), patron),
                        cb.like(cb.lower(root.<String>get("motivo")), patron)));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
