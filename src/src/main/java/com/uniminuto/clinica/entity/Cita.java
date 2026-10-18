package com.uniminuto.clinica.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Cita médica: una mascota de un cliente atendida por un veterinario en una fecha y hora.
 * El estado se maneja con {@link com.uniminuto.clinica.enums.EstadoCita}.
 */
@Entity
@Table(name = "cita")
@Data
public class Cita {

    /** Identificador de la cita. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    /** Cliente que solicita la cita. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    /** Mascota que será atendida; pertenece al cliente. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "mascota_id", nullable = false)
    private Mascota mascota;

    /** Veterinario asignado. */
    @ManyToOne(optional = false)
    @JoinColumn(name = "medico_id", nullable = false)
    private Medico medico;

    /** Fecha y hora programadas. */
    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    /** Estado almacenado como etiqueta (Pendiente, Confirmada, Atendida, Cancelada, Programada). */
    @Column(name = "estado", nullable = false, length = 20)
    private String estado;

    /** Motivo de la consulta. */
    @Column(name = "motivo", columnDefinition = "TEXT")
    private String motivo;
}
