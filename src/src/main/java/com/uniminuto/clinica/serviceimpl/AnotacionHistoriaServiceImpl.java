package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.AnotacionHistoria;
import com.uniminuto.clinica.entity.HistoriaMedica;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.enums.EstadoHistoria;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.ResourceNotFoundException;
import com.uniminuto.clinica.models.AnotacionHistoriaRq;
import com.uniminuto.clinica.models.AnotacionResumenRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.AnotacionFiltro;
import com.uniminuto.clinica.repository.AnotacionHistoriaRepository;
import com.uniminuto.clinica.repository.HistoriaMedicaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.AnotacionHistoriaService;
import com.uniminuto.clinica.specification.AnotacionHistoriaSpecification;
import com.uniminuto.clinica.util.FechaUtil;
import com.uniminuto.clinica.util.PaginacionUtil;
import com.uniminuto.clinica.util.TextoUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Implementación del servicio de anotaciones. Reglas de negocio aplicadas:
 * <ol>
 *   <li>La anotación pertenece a una historia clínica existente y abierta: una historia cerrada
 *       es de solo lectura.</li>
 *   <li>El veterinario debe existir.</li>
 *   <li>Descripción, observación y diagnóstico son obligatorios.</li>
 *   <li>La fecha no puede ser futura ni anterior a la consulta de la historia.</li>
 *   <li>Las anotaciones no se editan ni se eliminan: son parte del historial clínico.</li>
 * </ol>
 */
@Service
public class AnotacionHistoriaServiceImpl implements AnotacionHistoriaService {

    /** Columnas por las que se puede ordenar el histórico: clave pública → propiedad de la entidad. */
    private static final Map<String, String> ORDENABLES = Map.of(
            "id", "id",
            "fecha", "fecha",
            "veterinario", "medico.apellidos",
            "descripcion", "descripcion",
            "diagnostico", "diagnostico");

    /** Acceso a datos de anotaciones. */
    @Autowired
    private AnotacionHistoriaRepository anotacionRepository;

    /** Acceso a datos de historias clínicas. */
    @Autowired
    private HistoriaMedicaRepository historiaMedicaRepository;

    /** Acceso a datos de veterinarios. */
    @Autowired
    private MedicoRepository medicoRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<AnotacionHistoria> listarPorHistoria(Long historiaId) {
        if (!historiaMedicaRepository.existsById(historiaId)) {
            throw new ResourceNotFoundException("La historia clínica con ID " + historiaId + " no existe");
        }
        return anotacionRepository.findByHistoriaIdOrderByFechaDesc(historiaId);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<AnotacionResumenRs> listarAnotacionesPaginado(AnotacionFiltro filtro) {
        Pageable pageable = PaginacionUtil.construir(filtro, ORDENABLES, "fecha", Sort.Direction.DESC);
        Page<AnotacionHistoria> pagina = anotacionRepository
                .findAll(AnotacionHistoriaSpecification.desdeFiltro(filtro), pageable);
        return PaginaRs.desde(pagina, AnotacionResumenRs::desde);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public AnotacionHistoria consultarAnotacion(Long id) {
        return anotacionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La anotación con ID " + id + " no existe"));
    }

    /**
     * {@inheritDoc}
     *
     * @throws BadRequestException si faltan datos, la historia o el veterinario no existen o la fecha no es coherente
     * @throws ConflictException   si la historia clínica está cerrada
     */
    @Override
    @Transactional
    public MiRespuestaRS crearAnotacion(AnotacionHistoriaRq rq) {
        validarCamposObligatorios(rq);

        HistoriaMedica historia = historiaMedicaRepository.findById(rq.getHistoriaId())
                .orElseThrow(() -> new BadRequestException("La historia clínica seleccionada no existe"));
        if (EstadoHistoria.CERRADA.coincideCon(historia.getEstado())) {
            throw new ConflictException("La historia clínica está cerrada y no admite nuevas anotaciones");
        }
        Medico medico = medicoRepository.findById(rq.getMedicoId())
                .orElseThrow(() -> new BadRequestException("El veterinario seleccionado no existe"));

        LocalDateTime fecha = rq.getFecha() == null ? LocalDateTime.now() : rq.getFecha();
        if (FechaUtil.esFutura(fecha)) {
            throw new BadRequestException("La fecha de la anotación no puede ser futura");
        }
        if (FechaUtil.esAnterior(fecha, historia.getFechaCreacion())) {
            throw new BadRequestException("La fecha de la anotación no puede ser anterior a la consulta ("
                    + FechaUtil.formatear(historia.getFechaCreacion()) + ")");
        }

        AnotacionHistoria anotacion = new AnotacionHistoria();
        anotacion.setHistoria(historia);
        anotacion.setMedico(medico);
        anotacion.setFecha(fecha);
        anotacion.setDescripcion(rq.getDescripcion().trim());
        anotacion.setObservacion(rq.getObservacion().trim());
        anotacion.setDiagnostico(rq.getDiagnostico().trim());
        AnotacionHistoria guardada = anotacionRepository.save(anotacion);

        return MiRespuestaRS.of(HttpStatus.CREATED.value(), "Anotación registrada exitosamente", guardada.getId());
    }

    /**
     * Valida los campos obligatorios para crear una anotación.
     *
     * @param rq solicitud a validar
     * @throws BadRequestException si falta algún dato
     */
    private void validarCamposObligatorios(AnotacionHistoriaRq rq) {
        if (rq == null) {
            throw new BadRequestException("Los datos de la anotación son obligatorios");
        }
        if (rq.getHistoriaId() == null) {
            throw new BadRequestException("La historia clínica es obligatoria");
        }
        if (rq.getMedicoId() == null) {
            throw new BadRequestException("El veterinario es obligatorio");
        }
        if (TextoUtil.estaVacio(rq.getDescripcion())) {
            throw new BadRequestException("La descripción es obligatoria");
        }
        if (TextoUtil.estaVacio(rq.getObservacion())) {
            throw new BadRequestException("La observación es obligatoria");
        }
        if (TextoUtil.estaVacio(rq.getDiagnostico())) {
            throw new BadRequestException("El diagnóstico o la evolución es obligatorio");
        }
    }
}
