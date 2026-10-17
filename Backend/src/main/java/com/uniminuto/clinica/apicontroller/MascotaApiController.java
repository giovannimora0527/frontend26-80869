package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.MascotaApi;
import com.uniminuto.clinica.entity.Mascota;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.models.MascotaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.service.MascotaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
public class MascotaApiController implements MascotaApi {

    @Autowired
    private MascotaService mascotaService;

    @Override
    public ResponseEntity<List<Mascota>> listarMascotas() throws BadRequestException {
       return ResponseEntity.ok(mascotaService.listarMascotas());
    }

    @Override
    public ResponseEntity<List<Mascota>> listarMascotasOrdenado(boolean ascendente) throws BadRequestException {
        return ResponseEntity.ok(mascotaService.listarMascotasOrdenado(ascendente));
    }

    @Override
    public ResponseEntity<List<Mascota>> buscarMascotaPorNombre(String nombre) throws BadRequestException {
        return ResponseEntity.ok(mascotaService.findByNombreMascota(nombre).map(List::of).orElseGet(List::of));
    }

    @Override
    public ResponseEntity<List<Mascota>> buscarMascotaPorCliente(Long clienteId) throws BadRequestException {
        return ResponseEntity.ok(mascotaService.buscarMascotasPorCliente(clienteId));

    }

    @Override
    public ResponseEntity<List<Mascota>> buscarMascotaPorRaza(Integer razaId) throws BadRequestException {
        return ResponseEntity.ok(mascotaService.buscarMascotasPorRaza(razaId));
    }

    @Override
    public ResponseEntity<Mascota> obtenerMascota(Integer id) throws BadRequestException {
        return ResponseEntity.ok(mascotaService.obtenerPorId(id));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> guardarMascota(MascotaRq mascotaRq) throws BadRequestException {
        return ResponseEntity.ok(mascotaService.guardarMascota(mascotaRq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> actualizarMascota(MascotaRq mascotaRq) throws BadRequestException {
        return ResponseEntity.ok(mascotaService.actualizarMascota(mascotaRq));
    }
}