package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.enums.EstadoCita;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.ResourceNotFoundException;
import com.uniminuto.clinica.models.CitaResumenRs;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.CitaFiltro;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.CitaService;
import com.uniminuto.clinica.specification.CitaSpecification;
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
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

/**
 * Implementación del servicio de citas. Reglas de negocio aplicadas (y su justificación):
 * <ol>
 *   <li>El cliente, la mascota y el veterinario deben existir (integridad referencial).</li>
 *   <li>La mascota debe pertenecer al cliente: evita citas con datos cruzados entre clientes.</li>
 *   <li>No se aceptan fechas pasadas: una cita es una reserva a futuro.</li>
 *   <li>Un veterinario no puede tener dos citas vigentes con menos de {@value #MARGEN_MINUTOS}
 *       minutos de diferencia, y una mascota tampoco puede estar en dos citas simultáneas.
 *       Las citas canceladas liberan la agenda.</li>
 *   <li>Una cita atendida es un registro clínico histórico: no admite cambios.</li>
 *   <li>Una cita cancelada solo vuelve a estar activa con la operación explícita de reactivación.</li>
 *   <li>Cliente y mascota no se cambian en una cita existente: se cancela y se registra otra.</li>
 * </ol>
 */
@Service
public class CitaServiceImpl implements CitaService {

    /** Margen en minutos, antes y después de una cita, en que el veterinario y la mascota no pueden tener otra. */
    private static final long MARGEN_MINUTOS = 15;

    /** Valor de "excluir" cuando no hay ninguna cita que ignorar (ningún id real es 0). */
    private static final long SIN_EXCLUIR = 0L;

    /** Columnas por las que se puede ordenar el listado: clave pública → propiedad de la entidad. */
    private static final Map<String, String> ORDENABLES = Map.of(
            "id", "id",
            "fecha", "fechaHora",
            "hora", "fechaHora",
            "fechaHora", "fechaHora",
            "cliente", "cliente.apellidos",
            "mascota", "mascota.nombreMascota",
            "veterinario", "medico.apellidos",
            "estado", "estado",
            "motivo", "motivo");

    /** Acceso a datos de citas. */
    @Autowired
    private CitaRepository citaRepository;

    /** Acceso a datos de clientes. */
    @Autowired
    private ClienteRepository clienteRepository;

    /** Acceso a datos de mascotas. */
    @Autowired
    private MascotaRepository mascotaRepository;

    /** Acceso a datos de veterinarios. */
    @Autowired
    private MedicoRepository medicoRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Cita> listarCitas() {
        return citaRepository.findAllByOrderByFechaHoraDesc();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<CitaResumenRs> listarCitasPaginado(CitaFiltro filtro) {
        Pageable pageable = PaginacionUtil.construir(filtro, ORDENABLES, "fechaHora", Sort.Direction.DESC);
        Page<Cita> pagina = citaRepository.findAll(CitaSpecification.desdeFiltro(filtro), pageable);
        return PaginaRs.desde(pagina, CitaResumenRs::desde);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Cita consultarCita(Long id) {
        return buscarCita(id);
    }

    /**
     * {@inheritDoc}
     *
     * @throws BadRequestException si faltan datos, alguna referencia no existe, la mascota no es del
     *                             cliente, la fecha es pasada o el estado inicial no es activo
     * @throws ConflictException   si el veterinario o la mascota ya tienen una cita en ese horario
     */
    @Override
    @Transactional
    public MiRespuestaRS crearCita(CitaRq rq) {
        validarCamposObligatorios(rq);

        Cliente cliente = clienteRepository.findById(rq.getClienteId())
                .orElseThrow(() -> new BadRequestException("El cliente seleccionado no existe"));
        Mascota mascota = mascotaRepository.findById(rq.getMascotaId())
                .orElseThrow(() -> new BadRequestException("La mascota seleccionada no existe"));
        if (mascota.getCliente() == null || !cliente.getId().equals(mascota.getCliente().getId())) {
            throw new BadRequestException("La mascota seleccionada no pertenece al cliente indicado");
        }
        Medico medico = medicoRepository.findById(rq.getMedicoId())
                .orElseThrow(() -> new BadRequestException("El veterinario seleccionado no existe"));

        LocalDateTime fechaHora = normalizar(rq.resolverFechaHora());
        if (FechaUtil.esPasada(fechaHora)) {
            throw new BadRequestException("No se pueden registrar citas en fechas anteriores a la fecha actual");
        }

        EstadoCita estado = TextoUtil.estaVacio(rq.getEstado()) ? EstadoCita.PENDIENTE
                : EstadoCita.desdeTexto(rq.getEstado());
        if (!estado.esActiva()) {
            throw new BadRequestException("Una cita nueva solo puede registrarse como Pendiente, Programada o Confirmada");
        }

        validarDisponibilidad(medico.getId(), mascota.getMascotaId(), fechaHora, SIN_EXCLUIR);

        Cita cita = new Cita();
        cita.setCliente(cliente);
        cita.setMascota(mascota);
        cita.setMedico(medico);
        cita.setFechaHora(fechaHora);
        cita.setMotivo(rq.getMotivo().trim());
        cita.setEstado(estado.getEtiqueta());
        Cita guardada = citaRepository.save(cita);

        return MiRespuestaRS.of(HttpStatus.CREATED.value(), "Cita registrada exitosamente", guardada.getId());
    }

    /**
     * {@inheritDoc}
     *
     * @throws ResourceNotFoundException si la cita no existe
     * @throws ConflictException         si la cita está atendida, cancelada, o el nuevo horario no está disponible
     * @throws BadRequestException       si se intenta cambiar cliente o mascota, la nueva fecha es pasada
     *                                   o algún dato no es válido
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarCita(Long id, CitaRq rq) {
        Cita cita = buscarCita(id);
        EstadoCita estadoActual = EstadoCita.desdeTexto(cita.getEstado());
        if (estadoActual == EstadoCita.ATENDIDA) {
            throw new ConflictException("La cita ya fue atendida; su información histórica no puede modificarse");
        }
        if (estadoActual == EstadoCita.CANCELADA) {
            throw new ConflictException("La cita está cancelada; para volver a activarla use la opción Reactivar");
        }
        if (rq == null) {
            throw new BadRequestException("Los datos de la cita son obligatorios");
        }
        if (rq.getClienteId() != null && !rq.getClienteId().equals(cita.getCliente().getId())) {
            throw new BadRequestException("No se puede cambiar el cliente de una cita; cancélela y registre una nueva");
        }
        if (rq.getMascotaId() != null && !rq.getMascotaId().equals(cita.getMascota().getMascotaId())) {
            throw new BadRequestException("No se puede cambiar la mascota de una cita; cancélela y registre una nueva");
        }

        Medico medico = rq.getMedicoId() == null ? cita.getMedico()
                : medicoRepository.findById(rq.getMedicoId())
                        .orElseThrow(() -> new BadRequestException("El veterinario seleccionado no existe"));
        LocalDateTime fechaHora = rq.resolverFechaHora() == null ? cita.getFechaHora()
                : normalizar(rq.resolverFechaHora());

        boolean cambiaAgenda = !fechaHora.equals(normalizar(cita.getFechaHora()))
                || !medico.getId().equals(cita.getMedico().getId());
        if (cambiaAgenda) {
            if (FechaUtil.esPasada(fechaHora)) {
                throw new BadRequestException("No se pueden registrar citas en fechas anteriores a la fecha actual");
            }
            validarDisponibilidad(medico.getId(), cita.getMascota().getMascotaId(), fechaHora, cita.getId());
            cita.setFechaHora(fechaHora);
            cita.setMedico(medico);
        }

        if (rq.getMotivo() != null) {
            if (TextoUtil.estaVacio(rq.getMotivo())) {
                throw new BadRequestException("El motivo de la consulta no puede quedar vacío");
            }
            cita.setMotivo(rq.getMotivo().trim());
        }

        if (!TextoUtil.estaVacio(rq.getEstado())) {
            EstadoCita nuevo = EstadoCita.desdeTexto(rq.getEstado());
            if (nuevo != estadoActual) {
                if (!estadoActual.puedePasarA(nuevo)) {
                    throw new ConflictException("No se puede cambiar el estado de la cita de "
                            + estadoActual.getEtiqueta() + " a " + nuevo.getEtiqueta());
                }
                cita.setEstado(nuevo.getEtiqueta());
            }
        }

        citaRepository.save(cita);
        return MiRespuestaRS.of(HttpStatus.OK.value(), "Cita actualizada exitosamente", cita.getId());
    }

    /**
     * {@inheritDoc}
     *
     * @throws ResourceNotFoundException si la cita no existe
     * @throws ConflictException         si la cita ya está atendida o cancelada
     */
    @Override
    @Transactional
    public MiRespuestaRS cancelarCita(Long id) {
        Cita cita = buscarCita(id);
        EstadoCita estado = EstadoCita.desdeTexto(cita.getEstado());
        if (estado == EstadoCita.ATENDIDA) {
            throw new ConflictException("No se puede cancelar una cita que ya fue atendida");
        }
        if (estado == EstadoCita.CANCELADA) {
            throw new ConflictException("La cita ya se encuentra cancelada");
        }
        cita.setEstado(EstadoCita.CANCELADA.getEtiqueta());
        citaRepository.save(cita);
        return MiRespuestaRS.of(HttpStatus.OK.value(), "Cita cancelada exitosamente", cita.getId());
    }

    /**
     * {@inheritDoc}
     *
     * @throws ResourceNotFoundException si la cita no existe
     * @throws ConflictException         si la cita no está cancelada, su fecha ya pasó o el horario ya no está libre
     */
    @Override
    @Transactional
    public MiRespuestaRS reactivarCita(Long id) {
        Cita cita = buscarCita(id);
        if (EstadoCita.desdeTexto(cita.getEstado()) != EstadoCita.CANCELADA) {
            throw new ConflictException("Solo las citas canceladas pueden reactivarse");
        }
        if (FechaUtil.esPasada(cita.getFechaHora())) {
            throw new ConflictException("No se puede reactivar una cita cuya fecha ya pasó; registre una nueva");
        }
        validarDisponibilidad(cita.getMedico().getId(), cita.getMascota().getMascotaId(),
                normalizar(cita.getFechaHora()), cita.getId());
        cita.setEstado(EstadoCita.PENDIENTE.getEtiqueta());
        citaRepository.save(cita);
        return MiRespuestaRS.of(HttpStatus.OK.value(), "Cita reactivada exitosamente", cita.getId());
    }

    /**
     * Busca una cita por id o lanza la excepción 404.
     *
     * @param id identificador de la cita
     * @return cita encontrada
     * @throws ResourceNotFoundException si no existe
     */
    private Cita buscarCita(Long id) {
        return citaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La cita con ID " + id + " no existe"));
    }

    /**
     * Quita los segundos y nanosegundos: las citas se manejan al minuto.
     *
     * @param fechaHora fecha y hora original
     * @return fecha y hora truncada al minuto
     */
    private LocalDateTime normalizar(LocalDateTime fechaHora) {
        return fechaHora.truncatedTo(ChronoUnit.MINUTES);
    }

    /**
     * Verifica que el veterinario y la mascota no tengan otra cita vigente dentro del margen
     * de {@value #MARGEN_MINUTOS} minutos antes y después de la fecha indicada.
     *
     * @param medicoId  veterinario de la cita
     * @param mascotaId mascota de la cita
     * @param fechaHora fecha y hora de la cita
     * @param excluirId cita que se ignora al comparar (la que se edita); {@link #SIN_EXCLUIR} si no aplica
     * @throws ConflictException si el veterinario o la mascota ya tienen una cita en ese horario
     */
    private void validarDisponibilidad(Long medicoId, Integer mascotaId, LocalDateTime fechaHora, Long excluirId) {
        LocalDateTime inicio = fechaHora.minusMinutes(MARGEN_MINUTOS);
        LocalDateTime fin = fechaHora.plusMinutes(MARGEN_MINUTOS);
        if (citaRepository.existeCitaVigenteDelMedico(medicoId, inicio, fin, excluirId)) {
            throw new ConflictException("El veterinario no está disponible: ya tiene una cita entre "
                    + FechaUtil.formatear(inicio) + " y " + FechaUtil.formatear(fin));
        }
        if (citaRepository.existeCitaVigenteDeLaMascota(mascotaId, inicio, fin, excluirId)) {
            throw new ConflictException("La mascota ya tiene una cita programada en ese horario (cita duplicada)");
        }
    }

    /**
     * Valida los campos obligatorios para crear una cita.
     *
     * @param rq solicitud a validar
     * @throws BadRequestException si falta algún dato
     */
    private void validarCamposObligatorios(CitaRq rq) {
        if (rq == null) {
            throw new BadRequestException("Los datos de la cita son obligatorios");
        }
        if (rq.getClienteId() == null) {
            throw new BadRequestException("El cliente es obligatorio");
        }
        if (rq.getMascotaId() == null) {
            throw new BadRequestException("La mascota es obligatoria");
        }
        if (rq.getMedicoId() == null) {
            throw new BadRequestException("El veterinario es obligatorio");
        }
        if (rq.resolverFechaHora() == null) {
            throw new BadRequestException("La fecha y la hora de la cita son obligatorias");
        }
        if (TextoUtil.estaVacio(rq.getMotivo())) {
            throw new BadRequestException("El motivo de la consulta es obligatorio");
        }
    }
}
