package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.FormulaMedicaRS;
import com.uniminuto.clinica.models.FormulaMedicaRq;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.FormulaMedicaRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.service.FormulaMedicaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementacion de la logica de negocio para la gestion de formulas medicas.
 * Garantiza la integridad referencial (cita y medicamento existentes) y aplica
 * las reglas de negocio de emision y actualizacion de recetas.
 */
@Service
public class FormulaMedicaServiceImpl implements FormulaMedicaService {

    @Autowired
    private FormulaMedicaRepository formulaMedicaRepository;

    @Autowired
    private CitaRepository citaRepository;

    @Autowired
    private MedicamentoRepository medicamentoRepository;

    @Autowired
    private MascotaRepository mascotaRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<FormulaMedicaRS> listar() throws BadRequestException {
        return formulaMedicaRepository.findAllByOrderByFechaCreacionRegistroDesc()
                .stream()
                .map(this::convertirARS)
                .collect(Collectors.toList());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public FormulaMedicaRS obtenerPorId(Long id) throws BadRequestException {
        if (id == null) {
            throw new BadRequestException("El identificador de la formula es obligatorio.");
        }
        FormulaMedica formula = formulaMedicaRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("La formula medica solicitada no existe."));
        return convertirARS(formula);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public FormulaMedicaRS crear(FormulaMedicaRq request) throws BadRequestException {
        this.validarRequest(request);
        Cita cita = this.obtenerCita(request.getCitaId());
        this.validarMedicamento(request.getMedicamentoId());
        this.validarMascotaDeCita(cita);
        this.validarFechaEmision(request.getFechaEmision(), cita);

        FormulaMedica formula = new FormulaMedica();
        this.asignarDatos(formula, request);
        formula.setActivo(Boolean.TRUE);
        formula.setFechaCreacionRegistro(
                request.getFechaEmision() != null ? request.getFechaEmision() : LocalDateTime.now());
        formula = formulaMedicaRepository.save(formula);
        return convertirARS(formula);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public FormulaMedicaRS actualizar(FormulaMedicaRq request) throws BadRequestException {
        if (request == null || request.getId() == null) {
            throw new BadRequestException("El identificador de la formula es obligatorio para actualizar.");
        }
        FormulaMedica formula = formulaMedicaRepository.findById(request.getId())
                .orElseThrow(() -> new BadRequestException("La formula medica que intenta modificar no existe."));

        this.validarRequest(request);
        Cita cita = this.obtenerCita(request.getCitaId());
        this.validarMedicamento(request.getMedicamentoId());
        this.validarMascotaDeCita(cita);
        this.validarFechaEmision(request.getFechaEmision(), cita);

        this.asignarDatos(formula, request);
        if (request.getFechaEmision() != null) {
            formula.setFechaCreacionRegistro(request.getFechaEmision());
        }
        formula.setFechaActualizacionRegistro(LocalDateTime.now());
        formula = formulaMedicaRepository.save(formula);
        return convertirARS(formula);
    }

    /**
     * Copia los datos del request a la entidad.
     *
     * @param formula entidad destino.
     * @param request datos de origen.
     */
    private void asignarDatos(FormulaMedica formula, FormulaMedicaRq request) {
        formula.setCitaId(request.getCitaId());
        formula.setMedicamentoId(request.getMedicamentoId());
        formula.setDosis(request.getDosis().trim());
        formula.setFrecuencia(request.getFrecuencia());
        formula.setDuracion(request.getDuracion());
        formula.setIndicaciones(request.getIndicaciones());
    }

    /**
     * Valida los campos obligatorios de la peticion.
     *
     * @param request datos de la formula.
     * @throws BadRequestException si falta algun campo obligatorio.
     */
    private void validarRequest(FormulaMedicaRq request) throws BadRequestException {
        if (request == null) {
            throw new BadRequestException("La informacion de la formula es obligatoria.");
        }
        if (request.getCitaId() == null) {
            throw new BadRequestException("Debe seleccionar una consulta (cita).");
        }
        if (request.getMedicamentoId() == null) {
            throw new BadRequestException("Debe seleccionar un medicamento.");
        }
        if (request.getDosis() == null || request.getDosis().isBlank()) {
            throw new BadRequestException("La dosis es obligatoria.");
        }
    }

    /**
     * Valida que la cita exista y la retorna.
     *
     * @param citaId identificador de la cita.
     * @return la cita encontrada.
     * @throws BadRequestException si la cita no existe.
     */
    private Cita obtenerCita(Integer citaId) throws BadRequestException {
        return citaRepository.findById(citaId.longValue())
                .orElseThrow(() -> new BadRequestException("La consulta (cita) asociada no existe."));
    }

    /**
     * Valida que el medicamento exista.
     *
     * @param medicamentoId identificador del medicamento.
     * @throws BadRequestException si el medicamento no existe.
     */
    private void validarMedicamento(Integer medicamentoId) throws BadRequestException {
        if (medicamentoRepository.findById(medicamentoId.longValue()).isEmpty()) {
            throw new BadRequestException("El medicamento seleccionado no existe.");
        }
    }

    /**
     * Regla de negocio: la cita debe pertenecer a una mascota existente y
     * registrada (asi la formula no queda asociada a una consulta huerfana ni
     * a una mascota de otro cliente).
     *
     * @param cita cita asociada a la formula.
     * @throws BadRequestException si la mascota de la cita no existe.
     */
    private void validarMascotaDeCita(Cita cita) throws BadRequestException {
        if (cita.getMascotaId() == null
                || mascotaRepository.findById(cita.getMascotaId()).isEmpty()) {
            throw new BadRequestException("La consulta seleccionada no pertenece a una mascota valida.");
        }
    }

    /**
     * Regla de negocio: la fecha de emision no puede ser anterior a la fecha
     * de la consulta asociada.
     *
     * @param fechaEmision fecha de emision propuesta.
     * @param cita         cita asociada.
     * @throws BadRequestException si la fecha de emision es anterior a la cita.
     */
    private void validarFechaEmision(LocalDateTime fechaEmision, Cita cita) throws BadRequestException {
        if (fechaEmision != null && cita.getFechaHora() != null
                && fechaEmision.isBefore(cita.getFechaHora())) {
            throw new BadRequestException(
                    "La fecha de emision no puede ser anterior a la fecha de la consulta asociada.");
        }
    }

    /**
     * Convierte una entidad {@link FormulaMedica} en su DTO de salida,
     * resolviendo el nombre del medicamento y de la mascota de la cita.
     *
     * @param formula entidad a convertir.
     * @return DTO de respuesta.
     */
    private FormulaMedicaRS convertirARS(FormulaMedica formula) {
        FormulaMedicaRS rs = new FormulaMedicaRS();
        rs.setId(formula.getId());
        rs.setCitaId(formula.getCitaId());
        rs.setMedicamentoId(formula.getMedicamentoId());
        rs.setDosis(formula.getDosis());
        rs.setFrecuencia(formula.getFrecuencia());
        rs.setDuracion(formula.getDuracion());
        rs.setIndicaciones(formula.getIndicaciones());
        rs.setActivo(formula.getActivo());
        rs.setFechaCreacionRegistro(formula.getFechaCreacionRegistro());
        rs.setFechaActualizacionRegistro(formula.getFechaActualizacionRegistro());

        // Resuelve el nombre del medicamento.
        if (formula.getMedicamentoId() != null) {
            Optional<Medicamento> optMed = medicamentoRepository.findById(formula.getMedicamentoId().longValue());
            optMed.ifPresent(med -> rs.setMedicamentoNombre(med.getNombre()));
        }

        // Resuelve el nombre de la mascota a traves de la cita.
        if (formula.getCitaId() != null) {
            Optional<Cita> optCita = citaRepository.findById(formula.getCitaId().longValue());
            if (optCita.isPresent() && optCita.get().getMascotaId() != null) {
                Optional<Mascota> optMascota = mascotaRepository.findById(optCita.get().getMascotaId());
                optMascota.ifPresent(mascota -> rs.setMascotaNombre(mascota.getNombreMascota()));
            }
        }
        return rs;
    }
}
