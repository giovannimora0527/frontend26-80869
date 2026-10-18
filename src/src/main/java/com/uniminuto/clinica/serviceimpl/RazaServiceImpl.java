package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.RazaRq;
import com.uniminuto.clinica.repository.RazaRepository;
import com.uniminuto.clinica.service.RazaService;
import com.uniminuto.clinica.util.TextoUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Implementación del servicio de razas.
 */
@Service
public class RazaServiceImpl implements RazaService {

    /** Acceso a datos de razas. */
    @Autowired
    private RazaRepository razaRepository;

    /** {@inheritDoc} */
    @Override
    public List<Raza> listarRazas() {
        return razaRepository.findAll(Sort.by("especie").ascending().and(Sort.by("nombre").ascending()));
    }

    /**
     * {@inheritDoc}
     *
     * @throws BadRequestException si falta el nombre o la especie
     * @throws ConflictException   si la raza ya existe para esa especie
     */
    @Override
    public MiRespuestaRS crearRazaNueva(RazaRq razaRq) {
        validarRazaRq(razaRq);
        String nombre = razaRq.getNombre().trim();
        String especie = razaRq.getEspecie().trim();
        if (razaRepository.findByEspecieAndNombre(especie, nombre).isPresent()) {
            throw new ConflictException("La raza ya existe para la especie indicada");
        }

        Raza nueva = new Raza();
        nueva.setEspecie(especie);
        nueva.setNombre(nombre);
        nueva.setFechaCreacion(LocalDateTime.now());
        Raza guardada = razaRepository.save(nueva);

        return MiRespuestaRS.of(HttpStatus.CREATED.value(), "Raza creada correctamente",
                guardada.getRazaId().longValue());
    }

    /**
     * Valida los campos obligatorios de una raza.
     *
     * @param razaRq solicitud a validar
     * @throws BadRequestException si falta algún dato
     */
    private void validarRazaRq(RazaRq razaRq) {
        if (razaRq == null || TextoUtil.estaVacio(razaRq.getNombre())) {
            throw new BadRequestException("El nombre de la raza es obligatorio");
        }
        if (TextoUtil.estaVacio(razaRq.getEspecie())) {
            throw new BadRequestException("La especie de la raza es obligatoria");
        }
    }
}
