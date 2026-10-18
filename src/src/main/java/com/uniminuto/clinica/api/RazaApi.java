package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.RazaRq;
import com.uniminuto.clinica.entity.Raza;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

/**
 * Contrato REST de razas. Ruta base: {@code /raza}.
 */
public interface RazaApi {

    /**
     * {@code GET /raza/listar}: lista las razas ordenadas por especie y nombre (combo del formulario de mascotas).
     *
     * @return 200 con la lista de razas
     */
    @GetMapping("/listar")
    ResponseEntity<List<Raza>> listarRazas();

    /**
     * {@code POST /raza/guardar}: registra una raza nueva.
     *
     * @param razaRq datos de la raza
     * @return 201 con el resultado, 400 por datos inválidos o 409 si la raza ya existe
     */
    @PostMapping("/guardar")
    ResponseEntity<MiRespuestaRS> guardarRaza(@RequestBody RazaRq razaRq);
}
