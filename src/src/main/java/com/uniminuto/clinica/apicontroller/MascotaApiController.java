package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.MascotaApi;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.service.MascotaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controlador REST de mascotas. Solo traduce HTTP ↔ servicio.
 */
@RestController
@RequestMapping("/mascota")
public class MascotaApiController implements MascotaApi {

    /** Servicio con la lógica de negocio de las mascotas. */
    @Autowired
    private MascotaService mascotaService;

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<Mascota>> listarMascotas() {
        return ResponseEntity.ok(mascotaService.listarMascotas());
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<Mascota> consultarMascota(Integer id) {
        return ResponseEntity.ok(mascotaService.consultarMascota(id));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<Mascota>> buscarMascotaPorNombre(String nombre) {
        return ResponseEntity.ok(mascotaService.buscarMascotasPorNombre(nombre));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<Mascota>> buscarMascotaPorCliente(Long clienteId) {
        return ResponseEntity.ok(mascotaService.buscarMascotasPorCliente(clienteId));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<List<Mascota>> buscarMascotaPorRaza(Integer razaId) {
        return ResponseEntity.ok(mascotaService.buscarMascotasPorRaza(razaId));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> guardarMascota(MascotaRq rq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mascotaService.guardarMascota(rq));
    }

    /** {@inheritDoc} */
    @Override
    public ResponseEntity<MiRespuestaRS> actualizarMascota(Integer id, MascotaRq rq) {
        return ResponseEntity.ok(mascotaService.actualizarMascota(id, rq));
    }
}
