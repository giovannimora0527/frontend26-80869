package com.uniminuto.clinica.specification;

import com.uniminuto.clinica.entity.HistoriaMedica;
import com.uniminuto.clinica.enums.EstadoHistoria;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.filtro.HistoriaFiltro;
import com.uniminuto.clinica.util.TextoUtil;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Construye la consulta dinámica del listado de historias clínicas a partir de {@link HistoriaFiltro}.
 */
public final class HistoriaMedicaSpecification {

    /** Constructor privado: clase de utilidades que no se instancia. */
    private HistoriaMedicaSpecification() {
    }

    /**
     * Crea la especificación que combina con AND todos los filtros informados.
     *
     * @param filtro filtros enviados por el cliente
     * @return especificación lista para usar con el repositorio
     */
    public static Specification<HistoriaMedica> desdeFiltro(HistoriaFiltro filtro) {
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
            if (filtro.getCitaId() != null) {
                predicados.add(cb.equal(root.get("cita").get("id"), filtro.getCitaId()));
            }
            if (!TextoUtil.estaVacio(filtro.getEstado())) {
                String estado = filtro.getEstado().trim();
                if (!EstadoHistoria.ABIERTA.coincideCon(estado) && !EstadoHistoria.CERRADA.coincideCon(estado)) {
                    throw new BadRequestException("El estado de la historia debe ser Abierta o Cerrada");
                }
                predicados.add(cb.equal(cb.lower(root.<String>get("estado")), estado.toLowerCase()));
            }
            PredicadosUtil.agregarRangoFechas(predicados, cb, root.<LocalDateTime>get("fechaCreacion"),
                    filtro.getFechaDesde(), filtro.getFechaHasta());

            if (!TextoUtil.estaVacio(filtro.getTexto())) {
                String patron = TextoUtil.patronLike(filtro.getTexto());
                predicados.add(cb.or(
                        cb.like(cb.lower(root.get("mascota").<String>get("nombreMascota")), patron),
                        cb.like(cb.lower(root.get("cliente").<String>get("nombres")), patron),
                        cb.like(cb.lower(root.get("cliente").<String>get("apellidos")), patron),
                        cb.like(cb.lower(root.get("medico").<String>get("nombres")), patron),
                        cb.like(cb.lower(root.get("medico").<String>get("apellidos")), patron),
                        cb.like(cb.lower(root.<String>get("motivo")), patron),
                        cb.like(cb.lower(root.<String>get("diagnostico")), patron)));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
