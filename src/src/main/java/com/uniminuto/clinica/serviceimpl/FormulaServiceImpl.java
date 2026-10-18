package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cita;
import com.uniminuto.clinica.entity.FormulaMedica;
import com.uniminuto.clinica.entity.HistoriaMedica;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Medicamento;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.enums.EstadoCita;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.ResourceNotFoundException;
import com.uniminuto.clinica.models.FormulaMedicaRq;
import com.uniminuto.clinica.models.FormulaResumenRs;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.PaginaRs;
import com.uniminuto.clinica.models.filtro.FormulaFiltro;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.FormulaMedicaRepository;
import com.uniminuto.clinica.repository.HistoriaMedicaRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.MedicamentoRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.FormulaService;
import com.uniminuto.clinica.specification.FormulaMedicaSpecification;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Implementación del servicio de fórmulas médicas. Reglas de negocio aplicadas:
 * <ol>
 *   <li>La mascota debe existir y pertenecer a un cliente registrado.</li>
 *   <li>El veterinario debe existir (por defecto es el de la cita).</li>
 *   <li>La fecha de emisión no puede ser anterior a la fecha de la consulta (cita) ni futura.</li>
 *   <li>La dosis debe incluir una cantidad mayor que cero y la duración debe estar entre
 *       {@value #DURACION_MINIMA} y {@value #DURACION_MAXIMA} días.</li>
 *   <li>Los campos obligatorios se validan aquí aunque el frontend ya los valide.</li>
 *   <li>La fórmula no puede asociarse a una cita ni a una historia de otra mascota.</li>
 *   <li>No se elimina físicamente: se inactiva para conservar la información clínica.</li>
 *   <li>No se duplica la misma receta activa (mismo medicamento) en una cita.</li>
 * </ol>
 */
@Service
public class FormulaServiceImpl implements FormulaService {

    /** Duración mínima del tratamiento, en días. */
    private static final int DURACION_MINIMA = 1;

    /** Duración máxima del tratamiento, en días. */
    private static final int DURACION_MAXIMA = 365;

    /** Longitud máxima del texto de frecuencia (tamaño de la columna). */
    private static final int LONGITUD_MAXIMA_FRECUENCIA = 100;

    /** Primer número (con decimales opcionales) que aparece en el texto de la dosis. */
    private static final Pattern NUMERO = Pattern.compile("\\d+(?:[.,]\\d+)?");

    /** Columnas por las que se puede ordenar el listado: clave pública → propiedad de la entidad. */
    private static final Map<String, String> ORDENABLES = Map.of(
            "id", "id",
            "fecha", "fechaCreacionRegistro",
            "fechaCreacion", "fechaCreacionRegistro",
            "mascota", "mascota.nombreMascota",
            "cliente", "mascota.cliente.apellidos",
            "veterinario", "medico.apellidos",
            "medicamento", "medicamento.nombre",
            "dosis", "dosis",
            "frecuencia", "frecuencia",
            "activo", "activo");

    /** Acceso a datos de fórmulas. */
    @Autowired
    private FormulaMedicaRepository formulaMedicaRepository;

    /** Acceso a datos de citas. */
    @Autowired
    private CitaRepository citaRepository;

    /** Acceso a datos de mascotas. */
    @Autowired
    private MascotaRepository mascotaRepository;

    /** Acceso a datos de veterinarios. */
    @Autowired
    private MedicoRepository medicoRepository;

    /** Acceso a datos de medicamentos. */
    @Autowired
    private MedicamentoRepository medicamentoRepository;

    /** Acceso a datos de historias clínicas. */
    @Autowired
    private HistoriaMedicaRepository historiaMedicaRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<FormulaMedica> listarFormulas() {
        return formulaMedicaRepository.findAllByOrderByFechaCreacionRegistroDesc();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public PaginaRs<FormulaResumenRs> listarFormulasPaginado(FormulaFiltro filtro) {
        Pageable pageable = PaginacionUtil.construir(filtro, ORDENABLES, "fecha", Sort.Direction.DESC);
        Page<FormulaMedica> pagina = formulaMedicaRepository
                .findAll(FormulaMedicaSpecification.desdeFiltro(filtro), pageable);
        return PaginaRs.desde(pagina, FormulaResumenRs::desde);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public FormulaMedica consultarFormula(Long id) {
        return buscarFormula(id);
    }

    /**
     * {@inheritDoc}
     *
     * @throws BadRequestException si faltan datos, alguna referencia no existe, la cita o la historia
     *                             son de otra mascota, la fecha de emisión no es coherente o la
     *                             dosis o la duración no son válidas
     * @throws ConflictException   si la cita está cancelada o ya tiene una fórmula activa del mismo medicamento
     */
    @Override
    @Transactional
    public MiRespuestaRS crearFormula(FormulaMedicaRq rq) {
        validarCamposObligatorios(rq);

        Cita cita = citaRepository.findById(rq.getCitaId())
                .orElseThrow(() -> new BadRequestException("La cita seleccionada no existe"));
        if (EstadoCita.desdeTexto(cita.getEstado()) == EstadoCita.CANCELADA) {
            throw new ConflictException("No se puede emitir una fórmula para una cita cancelada");
        }

        Mascota mascota = resolverMascota(rq, cita);
        Medico medico = rq.getMedicoId() == null ? cita.getMedico()
                : medicoRepository.findById(rq.getMedicoId())
                        .orElseThrow(() -> new BadRequestException("El veterinario seleccionado no existe"));
        HistoriaMedica historia = resolverHistoria(rq, cita, mascota);
        Medicamento medicamento = medicamentoRepository.findById(rq.getMedicamentoId())
                .orElseThrow(() -> new BadRequestException("El medicamento seleccionado no existe"));

        LocalDateTime emision = rq.getFechaEmision() == null ? LocalDateTime.now() : rq.getFechaEmision();
        if (FechaUtil.esFutura(emision)) {
            throw new BadRequestException("La fecha de emisión no puede ser futura");
        }
        if (FechaUtil.esAnterior(emision, cita.getFechaHora())) {
            throw new BadRequestException("La fecha de emisión no puede ser anterior a la fecha de la consulta ("
                    + FechaUtil.formatear(cita.getFechaHora()) + ")");
        }
        validarDosis(rq.getDosis());
        validarFrecuencia(rq.getFrecuencia());
        validarDuracion(rq.getDuracionDias());

        if (formulaMedicaRepository.existeFormulaActiva(cita.getId(), medicamento.getId())) {
            throw new ConflictException("Ya existe una fórmula activa de este medicamento para la consulta seleccionada");
        }

        FormulaMedica formula = new FormulaMedica();
        formula.setCita(cita);
        formula.setMascota(mascota);
        formula.setMedico(medico);
        formula.setHistoria(historia);
        formula.setMedicamento(medicamento);
        formula.setDosis(rq.getDosis().trim());
        formula.setFrecuencia(rq.getFrecuencia().trim());
        formula.setDuracionDias(rq.getDuracionDias());
        formula.setIndicaciones(rq.getIndicaciones().trim());
        formula.setFechaEmision(emision);
        formula.setActivo(Boolean.TRUE);
        formula.setFechaCreacionRegistro(LocalDateTime.now());
        FormulaMedica guardada = formulaMedicaRepository.save(formula);

        return MiRespuestaRS.of(HttpStatus.CREATED.value(), "Fórmula médica registrada exitosamente", guardada.getId());
    }

    /**
     * {@inheritDoc}
     *
     * @throws ResourceNotFoundException si la fórmula no existe
     * @throws ConflictException         si la fórmula está inactiva
     * @throws BadRequestException       si se intenta cambiar la cita, mascota, veterinario o medicamento,
     *                                   o si algún valor enviado no es válido
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarFormula(Long id, FormulaMedicaRq rq) {
        FormulaMedica formula = buscarFormula(id);
        if (!Boolean.TRUE.equals(formula.getActivo())) {
            throw new ConflictException("La fórmula está inactiva y ya no puede modificarse");
        }
        if (rq == null) {
            throw new BadRequestException("Los datos de la fórmula son obligatorios");
        }
        validarSinCambiosDeRelaciones(formula, rq);

        if (rq.getDosis() != null) {
            validarDosis(rq.getDosis());
            formula.setDosis(rq.getDosis().trim());
        }
        if (rq.getFrecuencia() != null) {
            validarFrecuencia(rq.getFrecuencia());
            formula.setFrecuencia(rq.getFrecuencia().trim());
        }
        if (rq.getDuracionDias() != null) {
            validarDuracion(rq.getDuracionDias());
            formula.setDuracionDias(rq.getDuracionDias());
        }
        if (rq.getIndicaciones() != null) {
            if (TextoUtil.estaVacio(rq.getIndicaciones())) {
                throw new BadRequestException("Las indicaciones no pueden quedar vacías");
            }
            formula.setIndicaciones(rq.getIndicaciones().trim());
        }
        formula.setFechaActualizacionRegistro(LocalDateTime.now());
        formulaMedicaRepository.save(formula);

        return MiRespuestaRS.of(HttpStatus.OK.value(), "Fórmula médica actualizada exitosamente", formula.getId());
    }

    /**
     * {@inheritDoc}
     *
     * @throws ResourceNotFoundException si la fórmula no existe
     * @throws ConflictException         si la fórmula ya está inactiva
     */
    @Override
    @Transactional
    public MiRespuestaRS inactivarFormula(Long id) {
        FormulaMedica formula = buscarFormula(id);
        if (!Boolean.TRUE.equals(formula.getActivo())) {
            throw new ConflictException("La fórmula ya se encuentra inactiva");
        }
        formula.setActivo(Boolean.FALSE);
        formula.setFechaActualizacionRegistro(LocalDateTime.now());
        formulaMedicaRepository.save(formula);
        return MiRespuestaRS.of(HttpStatus.OK.value(), "Fórmula médica inactivada exitosamente", formula.getId());
    }

    /**
     * Busca una fórmula por id o lanza la excepción 404.
     *
     * @param id identificador de la fórmula
     * @return fórmula encontrada
     * @throws ResourceNotFoundException si no existe
     */
    private FormulaMedica buscarFormula(Long id) {
        return formulaMedicaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La fórmula médica con ID " + id + " no existe"));
    }

    /**
     * Determina la mascota de la fórmula: la indicada (que debe existir y ser la de la cita) o, si no
     * se envía, la de la cita. Valida que pertenezca a un cliente registrado.
     *
     * @param rq   solicitud de la fórmula
     * @param cita cita (consulta) de la fórmula
     * @return mascota de la fórmula
     * @throws BadRequestException si no existe, es de otra cita o no tiene cliente registrado
     */
    private Mascota resolverMascota(FormulaMedicaRq rq, Cita cita) {
        Mascota mascota = cita.getMascota();
        if (rq.getMascotaId() != null) {
            mascota = mascotaRepository.findById(rq.getMascotaId())
                    .orElseThrow(() -> new BadRequestException("La mascota seleccionada no existe"));
            if (!mascota.getMascotaId().equals(cita.getMascota().getMascotaId())) {
                throw new BadRequestException("La cita seleccionada pertenece a otra mascota");
            }
        }
        if (mascota.getCliente() == null || mascota.getCliente().getId() == null) {
            throw new BadRequestException("La mascota no pertenece a un cliente registrado");
        }
        return mascota;
    }

    /**
     * Determina la historia clínica asociada: la indicada (que debe ser de la misma mascota y cita)
     * o, si no se envía, la historia de la cita si ya existe.
     *
     * @param rq      solicitud de la fórmula
     * @param cita    cita de la fórmula
     * @param mascota mascota de la fórmula
     * @return historia asociada, o {@code null} si la consulta aún no tiene historia
     * @throws BadRequestException si la historia no existe o es de otra mascota o consulta
     */
    private HistoriaMedica resolverHistoria(FormulaMedicaRq rq, Cita cita, Mascota mascota) {
        if (rq.getHistoriaId() == null) {
            return historiaMedicaRepository.findByCitaId(cita.getId()).orElse(null);
        }
        HistoriaMedica historia = historiaMedicaRepository.findById(rq.getHistoriaId())
                .orElseThrow(() -> new BadRequestException("La historia clínica seleccionada no existe"));
        if (!historia.getMascota().getMascotaId().equals(mascota.getMascotaId())) {
            throw new BadRequestException("La historia clínica pertenece a otra mascota");
        }
        if (!historia.getCita().getId().equals(cita.getId())) {
            throw new BadRequestException("La historia clínica pertenece a otra consulta");
        }
        return historia;
    }

    /**
     * Rechaza los intentos de cambiar las relaciones de una fórmula ya registrada: para corregirlas
     * se inactiva la fórmula y se emite una nueva.
     *
     * @param formula fórmula existente
     * @param rq      datos enviados en la edición
     * @throws BadRequestException si alguna relación enviada difiere de la actual
     */
    private void validarSinCambiosDeRelaciones(FormulaMedica formula, FormulaMedicaRq rq) {
        boolean cambiaCita = rq.getCitaId() != null && !rq.getCitaId().equals(formula.getCita().getId());
        boolean cambiaMascota = rq.getMascotaId() != null
                && !rq.getMascotaId().equals(formula.getMascota().getMascotaId());
        boolean cambiaMedico = rq.getMedicoId() != null && !rq.getMedicoId().equals(formula.getMedico().getId());
        boolean cambiaMedicamento = rq.getMedicamentoId() != null
                && !rq.getMedicamentoId().equals(formula.getMedicamento().getId());
        if (cambiaCita || cambiaMascota || cambiaMedico || cambiaMedicamento) {
            throw new BadRequestException("La cita, la mascota, el veterinario y el medicamento no pueden modificarse; "
                    + "inactive la fórmula y registre una nueva");
        }
    }

    /**
     * Valida que la dosis contenga una cantidad numérica mayor que cero (por ejemplo "500 mg").
     *
     * @param dosis texto de la dosis
     * @throws BadRequestException si está vacía, no tiene número o la cantidad no es positiva
     */
    private void validarDosis(String dosis) {
        if (TextoUtil.estaVacio(dosis)) {
            throw new BadRequestException("La dosis es obligatoria");
        }
        Matcher matcher = NUMERO.matcher(dosis);
        if (!matcher.find() || Double.parseDouble(matcher.group().replace(',', '.')) <= 0) {
            throw new BadRequestException("La dosis debe indicar una cantidad mayor que cero, por ejemplo '500 mg'");
        }
    }

    /**
     * Valida que la frecuencia no esté vacía ni supere la longitud de la columna.
     *
     * @param frecuencia texto de la frecuencia, por ejemplo "cada 8 horas"
     * @throws BadRequestException si está vacía o es demasiado larga
     */
    private void validarFrecuencia(String frecuencia) {
        if (TextoUtil.estaVacio(frecuencia)) {
            throw new BadRequestException("La frecuencia es obligatoria");
        }
        if (frecuencia.trim().length() > LONGITUD_MAXIMA_FRECUENCIA) {
            throw new BadRequestException("La frecuencia no puede superar los " + LONGITUD_MAXIMA_FRECUENCIA + " caracteres");
        }
    }

    /**
     * Valida que la duración del tratamiento esté dentro del rango permitido.
     *
     * @param duracionDias duración en días
     * @throws BadRequestException si es nula o está fuera del rango
     */
    private void validarDuracion(Integer duracionDias) {
        if (duracionDias == null || duracionDias < DURACION_MINIMA || duracionDias > DURACION_MAXIMA) {
            throw new BadRequestException("La duración del tratamiento debe estar entre " + DURACION_MINIMA
                    + " y " + DURACION_MAXIMA + " días");
        }
    }

    /**
     * Valida los campos obligatorios para crear una fórmula.
     *
     * @param rq solicitud a validar
     * @throws BadRequestException si falta algún dato
     */
    private void validarCamposObligatorios(FormulaMedicaRq rq) {
        if (rq == null) {
            throw new BadRequestException("Los datos de la fórmula son obligatorios");
        }
        if (rq.getCitaId() == null) {
            throw new BadRequestException("La consulta (cita) es obligatoria");
        }
        if (rq.getMedicamentoId() == null) {
            throw new BadRequestException("El medicamento es obligatorio");
        }
        if (TextoUtil.estaVacio(rq.getDosis())) {
            throw new BadRequestException("La dosis es obligatoria");
        }
        if (TextoUtil.estaVacio(rq.getFrecuencia())) {
            throw new BadRequestException("La frecuencia es obligatoria");
        }
        if (rq.getDuracionDias() == null) {
            throw new BadRequestException("La duración del tratamiento es obligatoria");
        }
        if (TextoUtil.estaVacio(rq.getIndicaciones())) {
            throw new BadRequestException("Las indicaciones son obligatorias");
        }
    }
}
