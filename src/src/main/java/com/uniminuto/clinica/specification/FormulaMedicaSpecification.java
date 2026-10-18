package com.uniminuto.clinica.specification;

import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.models.filtro.FormulaFiltro;
import com.uniminuto.clinica.util.TextoUtil;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Construye la consulta dinámica del listado de fórmulas médicas a partir de {@link FormulaFiltro}.
 */
public final class FormulaMedicaSpecification {

    /** Constructor privado: clase de utilidades que no se instancia. */
    private FormulaMedicaSpecification() {
    }

    /**
     * Crea la especificación que combina con AND todos los filtros informados.
     *
     * @param filtro filtros enviados por el cliente
     * @return especificación lista para usar con el repositorio
     */
    public static Specification<FormulaMedica> desdeFiltro(FormulaFiltro filtro) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();

            if (filtro.getActivo() != null) {
                predicados.add(cb.equal(root.get("activo"), filtro.getActivo()));
            }
            if (filtro.getClienteId() != null) {
                predicados.add(cb.equal(root.get("mascota").get("cliente").get("id"), filtro.getClienteId()));
            }
            if (filtro.getMascotaId() != null) {
                predicados.add(cb.equal(root.get("mascota").get("mascotaId"), filtro.getMascotaId()));
            }
            if (filtro.getMedicoId() != null) {
                predicados.add(cb.equal(root.get("medico").get("id"), filtro.getMedicoId()));
            }
            if (filtro.getMedicamentoId() != null) {
                predicados.add(cb.equal(root.get("medicamento").get("id"), filtro.getMedicamentoId()));
            }
            if (filtro.getCitaId() != null) {
                predicados.add(cb.equal(root.get("cita").get("id"), filtro.getCitaId()));
            }
            PredicadosUtil.agregarRangoFechas(predicados, cb, root.<LocalDateTime>get("fechaCreacionRegistro"),
                    filtro.getFechaDesde(), filtro.getFechaHasta());

            if (!TextoUtil.estaVacio(filtro.getTexto())) {
                String patron = TextoUtil.patronLike(filtro.getTexto());
                predicados.add(cb.or(
                        cb.like(cb.lower(root.get("mascota").<String>get("nombreMascota")), patron),
                        cb.like(cb.lower(root.get("mascota").get("cliente").<String>get("nombres")), patron),
                        cb.like(cb.lower(root.get("mascota").get("cliente").<String>get("apellidos")), patron),
                        cb.like(cb.lower(root.get("medico").<String>get("nombres")), patron),
                        cb.like(cb.lower(root.get("medico").<String>get("apellidos")), patron),
                        cb.like(cb.lower(root.get("medicamento").<String>get("nombre")), patron),
                        cb.like(cb.lower(root.<String>get("dosis")), patron),
                        cb.like(cb.lower(root.<String>get("frecuencia")), patron)));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
