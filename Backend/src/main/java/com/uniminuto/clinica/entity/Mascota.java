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

@Entity
@Table(name = "mascota")
@Data
public class Mascota {

    @Id
    @Column(name = "mascota_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer mascotaId;

    @Column(name = "nombre_mascota")
    private String nombreMascota;

    @Column(name = "edad")
    private Integer edad;

    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro;

    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "raza_id")
    private Raza raza;


}