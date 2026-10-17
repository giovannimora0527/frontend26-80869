package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.AnotacionHistoria;
import com.uniminuto.clinica.entity.HistoriaMedica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.AnotacionHistoriaRS;
import com.uniminuto.clinica.models.AnotacionHistoriaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.AnotacionHistoriaRepository;
import com.uniminuto.clinica.repository.HistoriaMedicaRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.AnotacionHistoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementacion de la logica de negocio para las anotaciones de historia
 * clinica. Permite agregar anotaciones a la historia de una mascota y
 * consultarlas ordenadas de la mas reciente a la mas antigua.
 */
@Service
public class AnotacionHistoriaServiceImpl implements AnotacionHistoriaService {

    @Autowired
    private HistoriaMedicaRepository historiaMedicaRepository;

    @Autowired
    private AnotacionHistoriaRepository anotacionHistoriaRepository;

    @Autowired
    private MascotaRepository mascotaRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    /** Valor usado cuando no se encuentra el nombre del veterinario. */
    private static final String SIN_DATO = "";

    /**
     * {@inheritDoc}
     */
    @Override
    public MiRespuestaRS crearAnotacionHistoria(AnotacionHistoriaRq anotacionHistoriaRq) throws BadRequestException {
        this.validarAnotacionHistoria(anotacionHistoriaRq);

        // Regla: el medico debe existir en el sistema.
        if (medicoRepository.findById(anotacionHistoriaRq.getMedicoId()).isEmpty()) {
            throw new BadRequestException("El veterinario seleccionado no existe.");
        }

        HistoriaMedica historia = this.resolverHistoria(anotacionHistoriaRq);

        AnotacionHistoria nuevaAnotacion = new AnotacionHistoria();
        nuevaAnotacion.setHistoriaId(historia.getId().intValue());
        nuevaAnotacion.setMedicoId(anotacionHistoriaRq.getMedicoId().intValue());
        nuevaAnotacion.setDescripcion(anotacionHistoriaRq.getDescripcion().trim());
        nuevaAnotacion.setObservacion(anotacionHistoriaRq.getObservacion());
        nuevaAnotacion.setDiagnostico(anotacionHistoriaRq.getDiagnostico());
        nuevaAnotacion.setFecha(LocalDateTime.now());
        this.anotacionHistoriaRepository.save(nuevaAnotacion);

        MiRespuestaRS rta = new MiRespuestaRS();
        rta.setStatus(HttpStatus.OK.value());
        rta.setMessage("Anotacion registrada correctamente.");
        return rta;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<AnotacionHistoriaRS> listarPorHistoria(Integer historiaId) throws BadRequestException {
        if (historiaId == null) {
            throw new BadRequestException("El identificador de la historia clinica es obligatorio.");
        }
        return anotacionHistoriaRepository.findByHistoriaIdOrderByFechaDesc(historiaId)
                .stream()
                .map(this::convertirARS)
                .collect(Collectors.toList());
    }

    /**
     * Resuelve la historia clinica a la que se agregara la anotacion. Si se
     * recibe un historiaId se usa; de lo contrario se busca (o se crea) la
     * historia de la mascota indicada.
     *
     * @param rq datos de la anotacion.
     * @return historia clinica resuelta.
     * @throws BadRequestException si no se puede resolver la historia.
     */
    private HistoriaMedica resolverHistoria(AnotacionHistoriaRq rq) throws BadRequestException {
        if (rq.getHistoriaId() != null) {
            return historiaMedicaRepository.findById(rq.getHistoriaId().longValue())
                    .orElseThrow(() -> new BadRequestException("La historia clinica indicada no existe."));
        }

        if (rq.getMascotaId() == null) {
            throw new BadRequestException("Debe indicar la historia clinica o la mascota.");
        }
        Optional<Mascota> optMascota = this.mascotaRepository.findById(rq.getMascotaId());
        if (optMascota.isEmpty()) {
            throw new BadRequestException("La mascota seleccionada no existe.");
        }

        List<HistoriaMedica> historias = historiaMedicaRepository.findByPacienteId(rq.getMascotaId());
        if (!historias.isEmpty()) {
            return historias.get(0);
        }
        HistoriaMedica nueva = new HistoriaMedica();
        nueva.setPacienteId(rq.getMascotaId());
        nueva.setFechaCreacion(LocalDateTime.now());
        return historiaMedicaRepository.save(nueva);
    }

    /**
     * Valida los campos obligatorios de la anotacion.
     *
     * @param rq datos de la anotacion.
     * @throws BadRequestException si falta algun campo obligatorio.
     */
    private void validarAnotacionHistoria(AnotacionHistoriaRq rq) throws BadRequestException {
        if (rq == null) {
            throw new BadRequestException("La anotacion es obligatoria.");
        }
        if (rq.getMedicoId() == null) {
            throw new BadRequestException("Debe seleccionar un veterinario.");
        }
        if (rq.getDescripcion() == null || rq.getDescripcion().isBlank()) {
            throw new BadRequestException("La descripcion de la anotacion es obligatoria.");
        }
        if (rq.getHistoriaId() == null && rq.getMascotaId() == null) {
            throw new BadRequestException("Debe indicar la historia clinica o la mascota.");
        }
    }

    /**
     * Convierte una entidad {@link AnotacionHistoria} en su DTO de salida.
     *
     * @param anotacion entidad a convertir.
     * @return DTO de respuesta.
     */
    private AnotacionHistoriaRS convertirARS(AnotacionHistoria anotacion) {
        AnotacionHistoriaRS rs = new AnotacionHistoriaRS();
        rs.setId(anotacion.getId());
        rs.setHistoriaId(anotacion.getHistoriaId());
        rs.setMedicoId(anotacion.getMedicoId());
        rs.setFecha(anotacion.getFecha());
        rs.setDescripcion(anotacion.getDescripcion());
        rs.setObservacion(anotacion.getObservacion());
        rs.setDiagnostico(anotacion.getDiagnostico());

        // Resuelve el nombre del veterinario para mostrarlo en la tabla.
        if (anotacion.getMedicoId() != null) {
            rs.setMedicoNombre(medicoRepository.findById(anotacion.getMedicoId().longValue())
                    .map(medico -> (medico.getNombres() + " " + medico.getApellidos()).trim())
                    .orElse(SIN_DATO));
        }
        return rs;
    }
}
