package com.uniminuto.clinica.models;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.util.TextoUtil;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Vista resumida de una cita para el listado (DataTable). El detalle completo se
 * obtiene con {@code GET /cita/consultar/{id}}.
 */
@Data
public class CitaResumenRs {

    /** Identificador de la cita. */
    private Long id;

    /** Fecha de la cita. */
    private LocalDate fecha;

    /** Hora de la cita. */
    private LocalTime hora;

    /** Fecha y hora completas de la cita. */
    private LocalDateTime fechaHora;

    /** Identificador del cliente. */
    private Long clienteId;

    /** Nombre completo del cliente. */
    private String clienteNombre;

    /** Identificador de la mascota. */
    private Integer mascotaId;

    /** Nombre de la mascota. */
    private String mascotaNombre;

    /** Identificador del veterinario. */
    private Long medicoId;

    /** Nombre completo del veterinario. */
    private String medicoNombre;

    /** Estado de la cita. */
    private String estado;

    /** Motivo de la consulta. */
    private String motivo;

    /**
     * Construye el resumen a partir de la entidad.
     *
     * @param cita cita a resumir
     * @return resumen de la cita
     */
    public static CitaResumenRs desde(Cita cita) {
        CitaResumenRs rs = new CitaResumenRs();
        rs.setId(cita.getId());
        rs.setFechaHora(cita.getFechaHora());
        rs.setFecha(cita.getFechaHora().toLocalDate());
        rs.setHora(cita.getFechaHora().toLocalTime());
        rs.setClienteId(cita.getCliente().getId());
        rs.setClienteNombre(TextoUtil.nombreCompleto(cita.getCliente().getNombres(), cita.getCliente().getApellidos()));
        rs.setMascotaId(cita.getMascota().getMascotaId());
        rs.setMascotaNombre(cita.getMascota().getNombreMascota());
        rs.setMedicoId(cita.getMedico().getId());
        rs.setMedicoNombre(TextoUtil.nombreCompleto(cita.getMedico().getNombres(), cita.getMedico().getApellidos()));
        rs.setEstado(cita.getEstado());
        rs.setMotivo(cita.getMotivo());
        return rs;
    }
}
