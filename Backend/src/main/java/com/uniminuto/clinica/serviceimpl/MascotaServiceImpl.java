package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.entity.Raza;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.repository.MascotaRepository;
import com.uniminuto.clinica.repository.RazaRepository;
import com.uniminuto.clinica.service.MascotaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class MascotaServiceImpl implements MascotaService {

    /**
     * Inyección de dependencias del repositorio de mascotas
     */
    @Autowired
    private MascotaRepository mascotaRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private RazaRepository razaRepository;

    @Override
    public List<Mascota> listarMascotas() {
        List<Mascota> mascotas = mascotaRepository.findAll();
        mascotas.sort((m1, m2) -> m1
                .getNombreMascota()
                .compareToIgnoreCase(m2.getNombreMascota()));
        return mascotas;
    }

    @Override
    public List<Mascota> listarMascotasOrdenado(boolean ascendente) {
        List<Mascota> mascotas;
        if (ascendente) {
            mascotas = mascotaRepository.findAllByOrderByNombreMascotaAsc();
        } else {
            mascotas = mascotaRepository.findAllByOrderByNombreMascotaDesc();
        }
        return mascotas;
    }

    @Override
    public Optional<Mascota> findByNombreMascota(String nombreMascota) {
        return Optional.ofNullable(mascotaRepository.findByNombreMascota(nombreMascota));
    }

    @Override
    public List<Mascota> buscarMascotasPorCliente(Long clienteId) throws BadRequestException {

        // Validar que cliente id != null
        if (clienteId == null) {
            throw new BadRequestException("El ID del cliente no puede ser nulo");
        }

        Optional<Cliente> optCliente = this.clienteRepository
                .findById(clienteId);

        if (optCliente.isEmpty()) {
            throw new BadRequestException("El cliente con ID " + clienteId + " no existe");
        }

        return this.mascotaRepository
                .findByClienteOrderByNombreMascotaAsc(optCliente.get());
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Mascota obtenerPorId(Integer id) throws BadRequestException {
        if (id == null) {
            throw new BadRequestException("El identificador de la mascota es obligatorio");
        }
        return this.mascotaRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("La mascota con ID " + id + " no existe"));
    }

    @Override
    public List<Mascota> buscarMascotasPorRaza(Integer razaId) throws BadRequestException {

        // Pasoo 1. Validar que raza id != null
        if (razaId == null) {
            throw new BadRequestException("El ID de la raza no puede ser nulo");
        }

        // Paso 2. Validar que la raza existe
        Optional<Raza> optRaza = this.razaRepository
                .findById(razaId);

        // Valido que la raza existe, si no existe lanzo una excepción
        if (optRaza.isEmpty()) {
            throw new BadRequestException("La raza con ID " + razaId + " no existe");
        }

        // Paso 3. Buscar las mascotas por raza
        return this.mascotaRepository
                .findByRazaOrderByNombreMascotaAsc(optRaza.get());
    }

    @Override
    public MiRespuestaRS guardarMascota(MascotaRq mascotaRq) throws BadRequestException {
        // Paso 1. Validar que el objeto mascotaRq no sea nulo
        try {
            this.validarMascotaRq(mascotaRq);
        } catch (BadRequestException e) {
            throw new BadRequestException("Error al validar la mascota: " + e.getMessage());
        }

        // Paso 2. Validar que la raza exista
        Optional<Raza> optRaza = this.razaRepository
                .findById(mascotaRq.getRazaId());
        if (optRaza.isEmpty()) {
            throw new BadRequestException("La raza con ID " + mascotaRq.getRazaId() + " no existe");

        }

        // Paso 3. Validar que el cliente exista
        Optional<Cliente> optCliente = this.clienteRepository
                .findById(mascotaRq.getClienteId());

        if (optCliente.isEmpty()) {
            throw new BadRequestException("El cliente con ID " + mascotaRq.getClienteId() + " no existe");
        }

        // Paso 4. Crear la nueva mascota y guardarla en la base de datos
        Mascota nueva = new Mascota();
        nueva.setNombreMascota(mascotaRq.getNombre());
        nueva.setEdad(mascotaRq.getEdad());
        nueva.setCliente(optCliente.get());
        nueva.setRaza(optRaza.get());
        nueva.setFechaRegistro(LocalDateTime.now());

        // Paso 5. Guardar la nueva mascota en la base de datos
        this.mascotaRepository.save(nueva);

        // Paso 6. generar la respuesta
        MiRespuestaRS respuesta = new MiRespuestaRS();
        respuesta.setStatus(200);
        respuesta.setMessage("Mascota guardada correctamente");
        return respuesta;
    }

    private void validarMascotaRq(MascotaRq mascotaRq) throws BadRequestException {
        if (mascotaRq == null) {
            throw new BadRequestException("El objeto de entrada no puede ser nulo");
        }
        if (mascotaRq.getNombre() == null || mascotaRq.getNombre().isEmpty()) {
            throw new BadRequestException("El nombre de la mascota no puede ser nulo o vacío");
        }
        if (mascotaRq.getClienteId() == null) {
            throw new BadRequestException("El id del cliente de entrada no es válido");
        }
        if (mascotaRq.getRazaId() == null) {
            throw new BadRequestException("El id de la raza de entrada no es válido");
        }
    }

    @Override
    public MiRespuestaRS actualizarMascota(MascotaRq mascotaRq) throws BadRequestException {
        // Paso 1. Validar que el objeto mascotaRq no sea nulo
        try {
            this.validarMascotaRq(mascotaRq);
        } catch (BadRequestException e) {
            throw new BadRequestException("Error al validar la mascota: " + e.getMessage());
        }

        // Paso 2. Validar que la raza exista
        Optional<Raza> optRaza = this.razaRepository
                .findById(mascotaRq.getRazaId());
        if (optRaza.isEmpty()) {
            throw new BadRequestException("La raza con ID " + mascotaRq.getRazaId() + " no existe");

        }

        // Paso 3. Validar que el cliente exista
        Optional<Cliente> optCliente = this.clienteRepository
                .findById(mascotaRq.getClienteId());

        if (optCliente.isEmpty()) {
            throw new BadRequestException("El cliente con ID " + mascotaRq.getClienteId() + " no existe");
        }

        // Paso 4. Buscar la mascota existente
        Optional<Mascota> optMascota = this.mascotaRepository.findById(mascotaRq.getMascotaId());
        if (optMascota.isEmpty()) {
            throw new BadRequestException("La mascota con ID " + mascotaRq.getMascotaId() + " no existe");
        }

        // Paso 5. Actualizar la mascota existente
        Mascota existente = optMascota.get();
        existente.setNombreMascota(mascotaRq.getNombre());
        existente.setEdad(mascotaRq.getEdad());
        existente.setCliente(optCliente.get());
        existente.setRaza(optRaza.get());
        existente.setFechaModificacion(LocalDateTime.now());

        // Paso 6. Guardar la mascota actualizada en la base de datos
        this.mascotaRepository.save(existente);

        // Paso 7. Generar la respuesta
        MiRespuestaRS respuesta = new MiRespuestaRS();
        respuesta.setStatus(200);
        respuesta.setMessage("Mascota actualizada correctamente");
        return respuesta;
    }

}
