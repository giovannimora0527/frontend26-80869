package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.HistoriaMedica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.models.HistoriaMedicaRQ;
import com.uniminuto.clinica.models.HistoriaMedicaRS;
import com.uniminuto.clinica.repository.AnotacionHistoriaRepository;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.repository.HistoriaMedicaRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.HistoriaMedicaService;
import com.uniminuto.clinica.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementacion de la logica de negocio para las historias clinicas.
 * La historia registra la consulta principal (cita, veterinario, motivo,
 * diagnostico, observaciones y estado) y mantiene una relacion 1:N con las
 * anotaciones. Valida que la mascota exista y que pertenezca al cliente
 * indicado (punto 3.2 del enunciado), evitando informacion huerfana.
 */
@Service
public class HistoriaMedicaServiceImpl implements HistoriaMedicaService {

    /** Estado por defecto de una historia recien creada. */
    private static final String ESTADO_ACTIVA = "ACTIVA";

    @Autowired
    private HistoriaMedicaRepository historiaMedicaRepository;

    @Autowired
    private MascotaRepository mascotaRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private AnotacionHistoriaRepository anotacionHistoriaRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<HistoriaMedicaRS> listarTodas() throws BadRequestException {
        return historiaMedicaRepository.findAllByOrderByFechaCreacionDesc()
                .stream()
                .map(this::convertirARS)
                .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<HistoriaMedicaRS> listar(LocalDateTime fechaInicial, LocalDateTime fechaFinal)
            throws BadRequestException {
        if (fechaInicial == null || fechaFinal == null) {
            throw new BadRequestException("Debe indicar fechaInicial y fechaFinal.");
        }
        if (fechaInicial.isAfter(fechaFinal)) {
            throw new BadRequestException("fechaInicial no puede ser posterior a fechaFinal.");
        }
        return historiaMedicaRepository
                .findByFechaCreacionBetweenOrderByFechaCreacionDesc(fechaInicial, fechaFinal)
                .stream()
                .map(this::convertirARS)
                .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public HistoriaMedicaRS obtenerPorId(Long id) throws BadRequestException {
        HistoriaMedica historia = historiaMedicaRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("No existe la historia clinica solicitada."));
        return convertirARS(historia);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public HistoriaMedicaRS crear(HistoriaMedicaRQ request) throws BadRequestException {
        this.validarRequest(request);

        HistoriaMedica historia = new HistoriaMedica();
        this.asignarDatos(historia, request);
        historia.setFechaCreacion(LocalDateTime.now());
        historia = historiaMedicaRepository.save(historia);
        return convertirARS(historia);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public HistoriaMedicaRS actualizar(HistoriaMedicaRQ request) throws BadRequestException {
        if (request == null || request.getId() == null) {
            throw new BadRequestException("El identificador es obligatorio para actualizar la historia clinica.");
        }
        HistoriaMedica historia = historiaMedicaRepository.findById(request.getId())
                .orElseThrow(() -> new BadRequestException("No existe la historia clinica que intenta modificar."));

        this.validarRequest(request);
        this.asignarDatos(historia, request);
        historia = historiaMedicaRepository.save(historia);
        return convertirARS(historia);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void eliminar(Long id) throws BadRequestException {
        if (!historiaMedicaRepository.existsById(id)) {
            throw new BadRequestException("No existe la historia clinica solicitada.");
        }
        historiaMedicaRepository.deleteById(id);
    }

    /**
     * Valida los datos de la historia: la mascota debe existir, el veterinario
     * (si se indica) debe existir, y la mascota debe pertenecer al cliente
     * indicado (regla del punto 3.2).
     *
     * @param request datos de la historia.
     * @throws BadRequestException si no se cumple alguna regla.
     */
    private void validarRequest(HistoriaMedicaRQ request) throws BadRequestException {
        if (request == null || request.getPacienteId() == null) {
            throw new BadRequestException("Debe seleccionar una mascota (paciente).");
        }
        Optional<Mascota> optMascota = mascotaRepository.findById(request.getPacienteId());
        if (optMascota.isEmpty()) {
            throw new BadRequestException("La mascota seleccionada no existe.");
        }
        if (request.getMedicoId() != null
                && medicoRepository.findById(request.getMedicoId().longValue()).isEmpty()) {
            throw new BadRequestException("El veterinario seleccionado no existe.");
        }
        // Regla: la mascota debe pertenecer al cliente indicado.
        if (request.getClienteId() != null) {
            if (clienteRepository.findById(request.getClienteId().longValue()).isEmpty()) {
                throw new BadRequestException("El cliente seleccionado no existe.");
            }
            Mascota mascota = optMascota.get();
            Integer clienteDeMascota = mascota.getCliente() != null && mascota.getCliente().getId() != null
                    ? mascota.getCliente().getId().intValue()
                    : null;
            if (clienteDeMascota == null || !clienteDeMascota.equals(request.getClienteId())) {
                throw new BadRequestException("La mascota seleccionada no pertenece al cliente indicado.");
            }
        }
    }

    /**
     * Copia los datos del request a la entidad.
     *
     * @param historia entidad destino.
     * @param request  datos de origen.
     */
    private void asignarDatos(HistoriaMedica historia, HistoriaMedicaRQ request) {
        historia.setPacienteId(request.getPacienteId());
        historia.setCitaId(request.getCitaId());
        historia.setMedicoId(request.getMedicoId());
        historia.setMotivo(request.getMotivo());
        historia.setDiagnostico(request.getDiagnostico());
        historia.setObservaciones(request.getObservaciones());
        historia.setEstado(request.getEstado() != null ? request.getEstado() : ESTADO_ACTIVA);
    }

    /**
     * Convierte una entidad {@link HistoriaMedica} en su DTO de salida,
     * resolviendo los nombres de mascota, cliente y veterinario, y contando
     * las anotaciones asociadas.
     *
     * @param historia entidad a convertir.
     * @return DTO de respuesta.
     */
    private HistoriaMedicaRS convertirARS(HistoriaMedica historia) {
        HistoriaMedicaRS rs = new HistoriaMedicaRS();
        rs.setId(historia.getId());
        rs.setPacienteId(historia.getPacienteId());
        rs.setCitaId(historia.getCitaId());
        rs.setMedicoId(historia.getMedicoId());
        rs.setMotivo(historia.getMotivo());
        rs.setDiagnostico(historia.getDiagnostico());
        rs.setObservaciones(historia.getObservaciones());
        rs.setEstado(historia.getEstado());
        rs.setFechaCreacion(historia.getFechaCreacion());
        rs.setTotalAnotaciones((int) anotacionHistoriaRepository
                .countByHistoriaId(historia.getId() != null ? historia.getId().intValue() : null));

        // Resuelve el nombre de la mascota y de su cliente.
        if (historia.getPacienteId() != null) {
            Optional<Mascota> optMascota = mascotaRepository.findById(historia.getPacienteId());
            if (optMascota.isPresent()) {
                Mascota mascota = optMascota.get();
                rs.setMascotaNombre(mascota.getNombreMascota());
                Cliente cliente = mascota.getCliente();
                if (cliente != null) {
                    rs.setClienteNombre((cliente.getNombres() + " " + cliente.getApellidos()).trim());
                }
            }
        }

        // Resuelve el nombre del veterinario.
        if (historia.getMedicoId() != null) {
            Optional<Medico> optMedico = medicoRepository.findById(historia.getMedicoId().longValue());
            optMedico.ifPresent(medico ->
                    rs.setMedicoNombre((medico.getNombres() + " " + medico.getApellidos()).trim()));
        }
        return rs;
    }
}
