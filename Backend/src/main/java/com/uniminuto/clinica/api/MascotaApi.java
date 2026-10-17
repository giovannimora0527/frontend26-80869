package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * API para la gestión de mascotas.
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/mascota")
public interface MascotaApi {

    /**
     * Metodo test del servicio.
     *
     * @return Servicio funcionando correctamente.
     * @throws BadRequestException excepcion.
     */
    @GetMapping(value = "/listar",
            produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<List<Mascota>> listarMascotas()
            throws BadRequestException;


    /**
     * Metodo test del servicio.
     *
     * @return Servicio funcionando correctamente.
     * @throws BadRequestException excepcion.
     */
    @GetMapping(value = "/listar-ordenado",
            produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<List<Mascota>> listarMascotasOrdenado(
            @RequestParam boolean ascendente)
            throws BadRequestException;


    /**
     * Metodo test del servicio.
     *
     * @return Servicio funcionando correctamente.
     * @throws BadRequestException excepcion.
     */
    @GetMapping(value = "/buscar-nombre",
            produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<List<Mascota>> buscarMascotaPorNombre(
            @RequestParam String nombre)
            throws BadRequestException;


    /**
     * Metodo test del servicio.
     *
     * @return Servicio funcionando correctamente.
     * @throws BadRequestException excepcion.
     */
    @GetMapping(value = "/buscar-by-cliente",
            produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<List<Mascota>> buscarMascotaPorCliente(
            @RequestParam Long clienteId)
            throws BadRequestException;

    /**
     * Metodo test del servicio.
     *
     * @return Servicio funcionando correctamente.
     * @throws BadRequestException excepcion.
     */
    @GetMapping(value = "/buscar-by-raza",
            produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<List<Mascota>> buscarMascotaPorRaza(
            @RequestParam Integer razaId)
            throws BadRequestException;

    /**
     * Consulta una mascota por su identificador.
     *
     * @param id identificador de la mascota.
     * @return mascota encontrada.
     * @throws BadRequestException si la mascota no existe.
     */
    @GetMapping(value = "/obtener/{id}", produces = {"application/json"})
    ResponseEntity<Mascota> obtenerMascota(
            @org.springframework.web.bind.annotation.PathVariable("id") Integer id)
            throws BadRequestException;


    /**
     * Metodo test del servicio.
     *
     * @return Servicio funcionando correctamente.
     * @throws BadRequestException excepcion.
     */
    @PostMapping(value = "/guardar",
            produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> guardarMascota(
            @RequestBody MascotaRq mascotaRq)
            throws BadRequestException;

    /**
     * Metodo test del servicio.
     *
     * @return Servicio funcionando correctamente.
     * @throws BadRequestException excepcion.
     */
    @PostMapping(value = "/actualizar",
            produces = {"application/json"},
            consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> actualizarMascota(
            @RequestBody MascotaRq mascotaRq)
            throws BadRequestException;
}
