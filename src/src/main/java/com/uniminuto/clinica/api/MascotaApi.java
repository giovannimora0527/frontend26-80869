package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * Contrato REST de mascotas. Ruta base: {@code /mascota}.
 */
public interface MascotaApi {

    /**
     * {@code GET /mascota/listar}: lista todas las mascotas ordenadas por nombre.
     *
     * @return 200 con la lista de mascotas
     */
    @GetMapping("/listar")
    ResponseEntity<List<Mascota>> listarMascotas();

    /**
     * {@code GET /mascota/consultar/{id}}: consulta una mascota.
     *
     * @param id identificador de la mascota
     * @return 200 con la mascota, o 404 si no existe
     */
    @GetMapping("/consultar/{id}")
    ResponseEntity<Mascota> consultarMascota(@PathVariable("id") Integer id);

    /**
     * {@code GET /mascota/buscar?nombre=}: busca mascotas por fragmento del nombre.
     *
     * @param nombre texto a buscar
     * @return 200 con las mascotas que coinciden
     */
    @GetMapping("/buscar")
    ResponseEntity<List<Mascota>> buscarMascotaPorNombre(@RequestParam("nombre") String nombre);

    /**
     * {@code GET /mascota/buscarPorCliente?clienteId=}: lista solo las mascotas de un cliente
     * (alimenta el combo dependiente Cliente → Mascota).
     *
     * @param clienteId identificador del cliente
     * @return 200 con las mascotas del cliente, o 404 si el cliente no existe
     */
    @GetMapping("/buscarPorCliente")
    ResponseEntity<List<Mascota>> buscarMascotaPorCliente(@RequestParam("clienteId") Long clienteId);

    /**
     * {@code GET /mascota/buscarPorRaza?razaId=}: lista las mascotas de una raza.
     *
     * @param razaId identificador de la raza
     * @return 200 con las mascotas de la raza, o 404 si la raza no existe
     */
    @GetMapping("/buscarPorRaza")
    ResponseEntity<List<Mascota>> buscarMascotaPorRaza(@RequestParam("razaId") Integer razaId);

    /**
     * {@code POST /mascota/guardar}: registra una mascota.
     *
     * @param rq datos de la mascota
     * @return 201 con el resultado, o 400 por datos inválidos
     */
    @PostMapping("/guardar")
    ResponseEntity<MiRespuestaRS> guardarMascota(@RequestBody MascotaRq rq);

    /**
     * {@code PUT /mascota/actualizar/{id}}: actualiza una mascota.
     *
     * @param id identificador de la mascota
     * @param rq nuevos datos
     * @return 200 con el resultado, 404 si no existe, 409 si se cambia el dueño de una mascota con citas
     */
    @PutMapping("/actualizar/{id}")
    ResponseEntity<MiRespuestaRS> actualizarMascota(@PathVariable("id") Integer id, @RequestBody MascotaRq rq);
}
