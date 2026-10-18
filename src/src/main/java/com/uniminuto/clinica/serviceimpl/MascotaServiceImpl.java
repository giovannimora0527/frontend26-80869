package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.ResourceNotFoundException;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.CitaRepository;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.RazaRepository;
import com.uniminuto.clinica.service.MascotaService;
import com.uniminuto.clinica.util.TextoUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Implementación del servicio de mascotas. Toda mascota pertenece a un cliente existente y a una
 * raza existente; una mascota con citas no puede cambiar de dueño (se perdería la coherencia
 * cliente → mascota → cita).
 */
@Service
public class MascotaServiceImpl implements MascotaService {

    /** Acceso a datos de mascotas. */
    @Autowired
    private MascotaRepository mascotaRepository;

    /** Acceso a datos de clientes. */
    @Autowired
    private ClienteRepository clienteRepository;

    /** Acceso a datos de razas. */
    @Autowired
    private RazaRepository razaRepository;

    /** Acceso a datos de citas (para proteger el cambio de dueño). */
    @Autowired
    private CitaRepository citaRepository;

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Mascota> listarMascotas() {
        return mascotaRepository.findAllByOrderByNombreMascotaAsc();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Mascota consultarMascota(Integer id) {
        return mascotaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("La mascota con ID " + id + " no existe"));
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Mascota> buscarMascotasPorNombre(String nombre) {
        if (TextoUtil.estaVacio(nombre)) {
            throw new BadRequestException("El nombre a buscar no puede estar vacío");
        }
        return mascotaRepository.findByNombreMascotaContainingIgnoreCaseOrderByNombreMascotaAsc(nombre.trim());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Mascota> buscarMascotasPorCliente(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("El cliente con ID " + clienteId + " no existe"));
        return mascotaRepository.findByClienteOrderByNombreMascotaAsc(cliente);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Mascota> buscarMascotasPorRaza(Integer razaId) {
        Raza raza = razaRepository.findById(razaId)
                .orElseThrow(() -> new ResourceNotFoundException("La raza con ID " + razaId + " no existe"));
        return mascotaRepository.findByRazaOrderByNombreMascotaAsc(raza);
    }

    /**
     * {@inheritDoc}
     *
     * @throws BadRequestException si faltan datos o el cliente o la raza no existen
     */
    @Override
    @Transactional
    public MiRespuestaRS guardarMascota(MascotaRq rq) {
        validarMascotaRq(rq);
        Raza raza = razaRepository.findById(rq.getRazaId())
                .orElseThrow(() -> new BadRequestException("La raza con ID " + rq.getRazaId() + " no existe"));
        Cliente cliente = clienteRepository.findById(rq.getClienteId())
                .orElseThrow(() -> new BadRequestException("El cliente con ID " + rq.getClienteId() + " no existe"));

        Mascota nueva = new Mascota();
        nueva.setNombreMascota(rq.getNombre().trim());
        nueva.setEdad(rq.getEdad());
        nueva.setCliente(cliente);
        nueva.setRaza(raza);
        nueva.setFechaRegistro(LocalDateTime.now());
        Mascota guardada = mascotaRepository.save(nueva);

        return MiRespuestaRS.of(HttpStatus.CREATED.value(), "Mascota guardada correctamente",
                guardada.getMascotaId().longValue());
    }

    /**
     * {@inheritDoc}
     *
     * @throws ResourceNotFoundException si la mascota no existe
     * @throws BadRequestException       si faltan datos o el cliente o la raza no existen
     * @throws ConflictException         si se intenta cambiar el dueño de una mascota que ya tiene citas
     */
    @Override
    @Transactional
    public MiRespuestaRS actualizarMascota(Integer id, MascotaRq rq) {
        Mascota existente = consultarMascota(id);
        validarMascotaRq(rq);
        Raza raza = razaRepository.findById(rq.getRazaId())
                .orElseThrow(() -> new BadRequestException("La raza con ID " + rq.getRazaId() + " no existe"));
        Cliente cliente = clienteRepository.findById(rq.getClienteId())
                .orElseThrow(() -> new BadRequestException("El cliente con ID " + rq.getClienteId() + " no existe"));

        boolean cambiaDeDueno = !cliente.getId().equals(existente.getCliente().getId());
        if (cambiaDeDueno && citaRepository.existeCitaDeLaMascota(existente.getMascotaId())) {
            throw new ConflictException("La mascota ya tiene citas registradas; no se puede cambiar de propietario");
        }

        existente.setNombreMascota(rq.getNombre().trim());
        existente.setEdad(rq.getEdad());
        existente.setCliente(cliente);
        existente.setRaza(raza);
        existente.setFechaModificacion(LocalDateTime.now());
        mascotaRepository.save(existente);

        return MiRespuestaRS.of(HttpStatus.OK.value(), "Mascota actualizada correctamente",
                existente.getMascotaId().longValue());
    }

    /**
     * Valida los campos obligatorios de una mascota.
     *
     * @param rq solicitud a validar
     * @throws BadRequestException si falta algún dato o la edad es negativa
     */
    private void validarMascotaRq(MascotaRq rq) {
        if (rq == null) {
            throw new BadRequestException("Los datos de la mascota son obligatorios");
        }
        if (TextoUtil.estaVacio(rq.getNombre())) {
            throw new BadRequestException("El nombre de la mascota es obligatorio");
        }
        if (rq.getEdad() == null || rq.getEdad() < 0) {
            throw new BadRequestException("La edad de la mascota es obligatoria y no puede ser negativa");
        }
        if (rq.getClienteId() == null) {
            throw new BadRequestException("El cliente propietario es obligatorio");
        }
        if (rq.getRazaId() == null) {
            throw new BadRequestException("La raza es obligatoria");
        }
    }
}
