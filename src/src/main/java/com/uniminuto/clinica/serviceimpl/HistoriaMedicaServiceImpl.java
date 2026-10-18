package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.HistoriaMedica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.enums.EstadoCita;
import com.uniminuto.clinica.enums.EstadoHistoria;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.ResourceNotFoundException;
import com.uniminuto.clinica.models.HistoriaMedicaRq;
import com.uniminuto.clinica.models.HistoriaResumenRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.HistoriaFiltro;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.repository.HistoriaMedicaRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.HistoriaMedicaService;
import com.uniminuto.clinica.specification.HistoriaMedicaSpecification;
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
 * Implementación del servicio de historias clínicas. Reglas de negocio:
 * <ol>
 *   <li>La historia pertenece a un cliente existente y a una mascota que sea de ese cliente.</li>
 *   <li>La historia se genera a partir de una cita de esa misma mascota que esté Atendida.</li>
 *   <li>Cada cita tiene como máximo una historia (evita duplicidad).</li>
 *   <li>La fecha de la consulta no puede ser futura ni anterior a la de la cita.</li>
 *   <li>Una historia cerrada ya no admite nuevas anotaciones.</li>
 * </ol>
 */
@Service
public class HistoriaMedicaServiceImpl implements HistoriaMedicaService {

    /**
     * Columnas por las que se puede ordenar el listado: clave pública → propiedad de la entidad.
     */
    private static final Map<String, String> ORDENABLES = Map.of(
            "id", "id",
            "fecha", "fechaCreacion",
            "fechaHora", "fechaCreacion",
            "mascota", "mascota.nombreMascota",
            "cliente", "cliente.apellidos",
            "veterinario", "medico.apellidos",
            "motivo", "motivo",
            "estado", "estado");

    /** Acceso a datos de historias clínicas. */
    @Autowired
    private HistoriaMedicaRepository historiaMedicaRepository;

    /** Acceso a datos de clientes. */
    @Autowired
    private ClienteRepository clienteRepository;

    /** Acceso a datos de mascotas. */
    @Autowired
    private MascotaRepository mascotaRepository;

    /** Acceso a datos de citas. */
    @Autowired
    private CitaRepository citaRepository;

    /** Acceso a datos de veterinarios. */
    @Autowired
    private MedicoRepository medicoRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<HistoriaMedica> listarHistorias() {
        return historiaMedicaRepository.findAllByOrderByFechaCreacionDesc();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<HistoriaResumenRs> listarHistoriasPaginado(HistoriaFiltro filtro) {
        Pageable pageable = PaginacionUtil.construir(filtro, ORDENABLES, "fechaHora", Sort.Direction.DESC);
        Page<HistoriaMedica> pagina = historiaMedicaRepository
                .findAll(HistoriaMedicaSpecification.desdeFiltro(filtro), pageable);
        return PaginaRs.desde(pagina, HistoriaResumenRs::desde);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public HistoriaMedica consultarHistoria(Long id) {
        return historiaMedicaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La historia clínica con ID " + id + " no existe"));
    }

    /**
     * {@inheritDoc}
     *
     * @throws BadRequestException si faltan datos, alguna referencia no existe, la mascota no es del cliente,
     *                             la cita es de otra mascota o la fecha no es coherente
     * @throws ConflictException   si la cita no está atendida o ya tiene historia
     */
    @Override
    @Transactional
    public MiRespuestaRS crearHistoria(HistoriaMedicaRq rq) {
        validarCamposObligatorios(rq);

        Cliente cliente = clienteRepository.findById(rq.getClienteId())
                .orElseThrow(() -> new BadRequestException("El cliente seleccionado no existe"));
        Mascota mascota = mascotaRepository.findById(rq.getMascotaId())
                .orElseThrow(() -> new BadRequestException("La mascota seleccionada no existe"));
        if (mascota.getCliente() == null || !cliente.getId().equals(mascota.getCliente().getId())) {
            throw new BadRequestException("La mascota seleccionada no pertenece al cliente indicado");
        }
        Cita cita = citaRepository.findById(rq.getCitaId())
                .orElseThrow(() -> new BadRequestException("La cita seleccionada no existe"));
        if (!mascota.getMascotaId().equals(cita.getMascota().getMascotaId())) {
            throw new BadRequestException("La cita seleccionada pertenece a otra mascota");
        }
        if (EstadoCita.desdeTexto(cita.getEstado()) != EstadoCita.ATENDIDA) {
            throw new ConflictException("Solo se puede crear la historia clínica de una cita atendida");
        }
        if (historiaMedicaRepository.findByCitaId(cita.getId()).isPresent()) {
            throw new ConflictException("La cita ya tiene una historia clínica asociada");
        }

        Medico medico = rq.getMedicoId() == null
                ? cita.getMedico()
                : medicoRepository.findById(rq.getMedicoId())
                        .orElseThrow(() -> new BadRequestException("El veterinario seleccionado no existe"));

        LocalDateTime fecha = rq.getFechaHora() == null ? LocalDateTime.now() : rq.getFechaHora();
        if (FechaUtil.esFutura(fecha)) {
            throw new BadRequestException("La fecha de la consulta no puede ser futura");
        }
        if (FechaUtil.esAnterior(fecha, cita.getFechaHora())) {
            throw new BadRequestException("La fecha de la consulta no puede ser anterior a la fecha de la cita");
        }

        HistoriaMedica historia = new HistoriaMedica();
        historia.setCliente(cliente);
        historia.setMascota(mascota);
        historia.setCita(cita);
        historia.setMedico(medico);
        historia.setFechaCreacion(fecha);
        historia.setMotivo(rq.getMotivo().trim());
        historia.setDiagnostico(rq.getDiagnostico().trim());
        historia.setObservaciones(TextoUtil.estaVacio(rq.getObservaciones()) ? null : rq.getObservaciones().trim());
        historia.setEstado(EstadoHistoria.ABIERTA.getEtiqueta());
        HistoriaMedica guardada = historiaMedicaRepository.save(historia);

        return MiRespuestaRS.of(HttpStatus.CREATED.value(), "Historia clínica creada exitosamente", guardada.getId());
    }

    /**
     * {@inheritDoc}
     *
     * @throws ResourceNotFoundException si la historia no existe
     * @throws ConflictException         si la historia ya está cerrada
     */
    @Override
    @Transactional
    public MiRespuestaRS cerrarHistoria(Long id) {
        HistoriaMedica historia = consultarHistoria(id);
        if (EstadoHistoria.CERRADA.coincideCon(historia.getEstado())) {
            throw new ConflictException("La historia clínica ya se encuentra cerrada");
        }
        historia.setEstado(EstadoHistoria.CERRADA.getEtiqueta());
        historiaMedicaRepository.save(historia);
        return MiRespuestaRS.of(HttpStatus.OK.value(), "Historia clínica cerrada exitosamente", historia.getId());
    }

    /**
     * Valida los campos obligatorios para crear una historia clínica.
     *
     * @param rq solicitud a validar
     * @throws BadRequestException si falta algún dato
     */
    private void validarCamposObligatorios(HistoriaMedicaRq rq) {
        if (rq == null) {
            throw new BadRequestException("Los datos de la historia clínica son obligatorios");
        }
        if (rq.getClienteId() == null) {
            throw new BadRequestException("El cliente es obligatorio");
        }
        if (rq.getMascotaId() == null) {
            throw new BadRequestException("La mascota es obligatoria");
        }
        if (rq.getCitaId() == null) {
            throw new BadRequestException("La cita es obligatoria");
        }
        if (TextoUtil.estaVacio(rq.getMotivo())) {
            throw new BadRequestException("El motivo de la consulta es obligatorio");
        }
        if (TextoUtil.estaVacio(rq.getDiagnostico())) {
            throw new BadRequestException("El diagnóstico es obligatorio");
        }
    }
}
