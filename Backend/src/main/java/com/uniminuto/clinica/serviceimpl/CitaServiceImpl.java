package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.CitaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.CitaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Implementacion de la logica de negocio para la gestion de citas.
 * Centraliza las reglas de negocio criticas (validacion de existencia de
 * mascota/medico, solapamiento de horarios, estados permitidos, etc.) de modo
 * que no dependan unicamente del frontend.
 */
@Service
public class CitaServiceImpl implements CitaService {

    /** Estado por defecto asignado a una cita recien creada. */
    private static final String ESTADO_PROGRAMADA = "PROGRAMADA";

    /** Estados validos que puede tener una cita. */
    private static final Set<String> ESTADOS_VALIDOS =
            Set.of("PENDIENTE", "CONFIRMADA", "ATENDIDA", "CANCELADA", "PROGRAMADA");

    /** Minutos de holgura antes y despues para evitar solapamiento de citas. */
    private static final int MINUTOS_HOLGURA = 15;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private MascotaRepository mascotaRepository;

    @Autowired
    private MedicoRepository medicoRepository;

    @Autowired
    private com.uniminuto.clinica.repository.ClienteRepository clienteRepository;

    /**
     * Valida que el cliente exista y que la mascota le pertenezca. Es una regla
     * critica del enunciado: no se puede registrar una cita para un cliente
     * inexistente ni seleccionar una mascota que no sea de ese cliente.
     *
     * @param clienteId identificador del cliente enviado (puede ser null).
     * @param mascota   mascota seleccionada.
     * @throws BadRequestException si el cliente no existe o la mascota no le pertenece.
     */
    private void validarPertenenciaCliente(Integer clienteId, Mascota mascota) throws BadRequestException {
        if (clienteId == null) {
            return;
        }
        if (clienteRepository.findById(clienteId.longValue()).isEmpty()) {
            throw new BadRequestException("El cliente seleccionado no existe.");
        }
        Integer clienteDeMascota = mascota.getCliente() != null && mascota.getCliente().getId() != null
                ? mascota.getCliente().getId().intValue()
                : null;
        if (clienteDeMascota == null || !clienteDeMascota.equals(clienteId)) {
            throw new BadRequestException("La mascota seleccionada no pertenece al cliente indicado.");
        }
    }

    /**
     * Lista todas las citas ordenadas por fecha y hora de forma descendente,
     * mostrando primero las mas recientes.
     *
     * @return listado de citas.
     * @throws BadRequestException si ocurre un error de negocio.
     */
    @Override
    public List<Cita> listarCitas() throws BadRequestException {
        return citaRepository.findAllByOrderByFechaHoraDesc();
    }

    /**
     * Lista las citas cuya fecha y hora se encuentre dentro del rango indicado.
     *
     * @param fechaInicio inicio del rango.
     * @param fechaFin    fin del rango.
     * @return citas dentro del rango ordenadas ascendentemente.
     * @throws BadRequestException si las fechas son invalidas.
     */
    @Override
    public List<Cita> listarCitasRango(LocalDateTime fechaInicio, LocalDateTime fechaFin)
            throws BadRequestException {
        this.validarFechas(fechaInicio, fechaFin);
        List<Cita> citas = citaRepository.findByFechaHoraBetween(fechaInicio, fechaFin);
        citas.sort((cita1, cita2) -> cita1.getFechaHora().compareTo(cita2.getFechaHora()));
        return citas;
    }

    /**
     * Obtiene una cita por su identificador.
     *
     * @param id identificador de la cita.
     * @return cita encontrada.
     * @throws BadRequestException si la cita no existe.
     */
    @Override
    public Cita obtenerPorId(Long id) throws BadRequestException {
        if (id == null) {
            throw new BadRequestException("El identificador de la cita es obligatorio.");
        }
        return citaRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("La cita solicitada no existe."));
    }

    /**
     * Crea una nueva cita aplicando todas las reglas de negocio.
     *
     * @param citaRq datos de la cita a crear.
     * @return respuesta con el mensaje de exito.
     * @throws BadRequestException si no se cumple alguna regla de negocio.
     */
    @Override
    public MiRespuestaRS crearCita(CitaRq citaRq) throws BadRequestException {
        this.validarCita(citaRq);

        Mascota mascota = this.obtenerMascota(citaRq.getMascotaId());
        this.obtenerMedico(citaRq.getMedicoId());
        this.validarPertenenciaCliente(citaRq.getClienteId(), mascota);

        // Regla: no se pueden registrar citas en fechas anteriores a la actual.
        if (citaRq.getFechaHora().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("No se puede registrar una cita en una fecha anterior a la actual.");
        }

        this.validarDisponibilidadMedico(citaRq.getMedicoId(), citaRq.getFechaHora(), null);
        this.validarDisponibilidadMascota(citaRq.getMascotaId(), citaRq.getFechaHora(), null);

        Cita nuevaCita = new Cita();
        nuevaCita.setClienteId(mascota.getCliente() != null ? mascota.getCliente().getId().intValue() : null);
        nuevaCita.setMascotaId(citaRq.getMascotaId());
        nuevaCita.setMedicoId(citaRq.getMedicoId().intValue());
        nuevaCita.setFechaHora(citaRq.getFechaHora());
        nuevaCita.setMotivo(citaRq.getMotivo());
        nuevaCita.setEstado(this.normalizarEstado(citaRq.getEstado()));
        citaRepository.save(nuevaCita);

        return this.construirRespuesta("La cita fue registrada correctamente.");
    }

    /**
     * Actualiza una cita existente respetando las restricciones por estado.
     *
     * @param citaRq datos de la cita a actualizar.
     * @return respuesta con el mensaje de exito.
     * @throws BadRequestException si no se cumple alguna regla de negocio.
     */
    @Override
    public MiRespuestaRS actualizarCita(CitaRq citaRq) throws BadRequestException {
        if (citaRq.getId() == null) {
            throw new BadRequestException("El identificador de la cita es obligatorio para actualizar.");
        }
        this.validarCita(citaRq);

        Cita citaActual = this.citaRepository.findById(citaRq.getId())
                .orElseThrow(() -> new BadRequestException("La cita que intenta modificar no existe."));

        // Regla: una cita cancelada no puede modificarse como si siguiera activa.
        if ("CANCELADA".equalsIgnoreCase(citaActual.getEstado())) {
            throw new BadRequestException("La cita esta cancelada y no puede modificarse.");
        }

        // Regla: una cita atendida no permite modificar su informacion historica.
        if ("ATENDIDA".equalsIgnoreCase(citaActual.getEstado())
                && !"ATENDIDA".equalsIgnoreCase(this.normalizarEstado(citaRq.getEstado()))) {
            throw new BadRequestException("La cita ya fue atendida y su informacion no puede modificarse.");
        }

        Mascota mascotaEdicion = this.obtenerMascota(citaRq.getMascotaId());
        this.obtenerMedico(citaRq.getMedicoId());
        this.validarPertenenciaCliente(citaRq.getClienteId(), mascotaEdicion);

        this.validarDisponibilidadMedico(citaRq.getMedicoId(), citaRq.getFechaHora(), citaActual.getId());
        this.validarDisponibilidadMascota(citaRq.getMascotaId(), citaRq.getFechaHora(), citaActual.getId());

        citaActual.setMascotaId(citaRq.getMascotaId());
        citaActual.setMedicoId(citaRq.getMedicoId().intValue());
        citaActual.setFechaHora(citaRq.getFechaHora());
        citaActual.setMotivo(citaRq.getMotivo());
        citaActual.setEstado(this.normalizarEstado(citaRq.getEstado()));
        citaRepository.save(citaActual);

        return this.construirRespuesta("La cita fue actualizada correctamente.");
    }

    /**
     * Valida que la mascota exista y la retorna.
     *
     * @param mascotaId identificador de la mascota.
     * @return la mascota encontrada.
     * @throws BadRequestException si la mascota no existe.
     */
    private Mascota obtenerMascota(Integer mascotaId) throws BadRequestException {
        Optional<Mascota> mascotaOptional = mascotaRepository.findById(mascotaId);
        if (mascotaOptional.isEmpty()) {
            throw new BadRequestException("La mascota seleccionada no existe.");
        }
        return mascotaOptional.get();
    }

    /**
     * Valida que el medico exista.
     *
     * @param medicoId identificador del medico.
     * @throws BadRequestException si el medico no existe.
     */
    private void obtenerMedico(Long medicoId) throws BadRequestException {
        if (medicoRepository.findById(medicoId).isEmpty()) {
            throw new BadRequestException("El veterinario seleccionado no existe.");
        }
    }

    /**
     * Valida que el medico no tenga otra cita dentro de la ventana de holgura.
     *
     * @param medicoId      identificador del medico.
     * @param fechaHora     fecha y hora propuesta para la cita.
     * @param citaIdExcluir identificador de la cita a excluir (en actualizacion).
     * @throws BadRequestException si existe un solapamiento.
     */
    private void validarDisponibilidadMedico(Long medicoId, LocalDateTime fechaHora, Long citaIdExcluir)
            throws BadRequestException {
        List<Cita> citas = citaRepository.findByMedicoIdAndFechaHoraBetween(
                medicoId.intValue(),
                fechaHora.minusMinutes(MINUTOS_HOLGURA),
                fechaHora.plusMinutes(MINUTOS_HOLGURA));
        boolean ocupado = citas.stream()
                .anyMatch(cita -> !cita.getId().equals(citaIdExcluir)
                        && !"CANCELADA".equalsIgnoreCase(cita.getEstado()));
        if (ocupado) {
            throw new BadRequestException(
                    "El veterinario ya tiene una cita en ese horario (ventana de "
                            + MINUTOS_HOLGURA + " minutos antes y despues).");
        }
    }

    /**
     * Valida que la mascota no tenga otra cita simultanea.
     *
     * @param mascotaId     identificador de la mascota.
     * @param fechaHora     fecha y hora propuesta.
     * @param citaIdExcluir identificador de la cita a excluir (en actualizacion).
     * @throws BadRequestException si existe un solapamiento.
     */
    private void validarDisponibilidadMascota(Integer mascotaId, LocalDateTime fechaHora, Long citaIdExcluir)
            throws BadRequestException {
        List<Cita> citas = citaRepository.findByMascotaIdAndFechaHoraBetween(
                mascotaId,
                fechaHora.minusMinutes(MINUTOS_HOLGURA),
                fechaHora.plusMinutes(MINUTOS_HOLGURA));
        boolean ocupado = citas.stream()
                .anyMatch(cita -> !cita.getId().equals(citaIdExcluir)
                        && !"CANCELADA".equalsIgnoreCase(cita.getEstado()));
        if (ocupado) {
            throw new BadRequestException("La mascota ya tiene una cita programada en ese horario.");
        }
    }

    /**
     * Normaliza y valida el estado recibido. Si no se envia, se asume PROGRAMADA.
     *
     * @param estado estado recibido en la peticion.
     * @return estado normalizado en mayusculas.
     * @throws BadRequestException si el estado no es valido.
     */
    private String normalizarEstado(String estado) throws BadRequestException {
        if (estado == null || estado.isBlank()) {
            return ESTADO_PROGRAMADA;
        }
        String estadoNormalizado = estado.trim().toUpperCase();
        if (!ESTADOS_VALIDOS.contains(estadoNormalizado)) {
            throw new BadRequestException("El estado de la cita no es valido.");
        }
        return estadoNormalizado;
    }

    /**
     * Valida que las fechas del rango no sean nulas ni invertidas.
     *
     * @param fechaInicio inicio del rango.
     * @param fechaFin    fin del rango.
     * @throws BadRequestException si las fechas son invalidas.
     */
    private void validarFechas(LocalDateTime fechaInicio, LocalDateTime fechaFin) throws BadRequestException {
        if (fechaInicio == null || fechaFin == null) {
            throw new BadRequestException("Las fechas no pueden ser nulas.");
        }
        if (fechaInicio.isAfter(fechaFin)) {
            throw new BadRequestException("La fecha de inicio no puede ser mayor a la fecha de fin.");
        }
    }

    /**
     * Valida los campos obligatorios de la cita recibida.
     *
     * @param citaRq datos de la cita.
     * @throws BadRequestException si falta algun campo obligatorio.
     */
    private void validarCita(CitaRq citaRq) throws BadRequestException {
        if (citaRq == null) {
            throw new BadRequestException("La informacion de la cita es obligatoria.");
        }
        if (citaRq.getFechaHora() == null) {
            throw new BadRequestException("La fecha y hora de la cita es obligatoria.");
        }
        if (citaRq.getMascotaId() == null) {
            throw new BadRequestException("Debe seleccionar una mascota.");
        }
        if (citaRq.getMedicoId() == null) {
            throw new BadRequestException("Debe seleccionar un veterinario.");
        }
        if (citaRq.getMotivo() == null || citaRq.getMotivo().isBlank()) {
            throw new BadRequestException("El motivo de la cita es obligatorio.");
        }
    }

    /**
     * Construye una respuesta estandar de exito.
     *
     * @param mensaje mensaje a retornar.
     * @return respuesta construida.
     */
    private MiRespuestaRS construirRespuesta(String mensaje) {
        MiRespuestaRS respuesta = new MiRespuestaRS();
        respuesta.setStatus(HttpStatus.OK.value());
        respuesta.setMessage(mensaje);
        return respuesta;
    }
}
