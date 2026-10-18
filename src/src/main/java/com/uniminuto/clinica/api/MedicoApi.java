package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Medico;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Contrato REST de consulta de veterinarios. Ruta base: {@code /medico}.
 */
public interface MedicoApi {

    /**
     * {@code GET /medico/listar}: lista todos los veterinarios ordenados por apellidos.
     *
     * @return 200 con la lista de veterinarios
     */
    @GetMapping("/listar")
    ResponseEntity<List<Medico>> listarMedicos();

    /**
     * {@code GET /medico/consultar/{id}}: consulta un veterinario.
     *
     * @param id identificador del veterinario
     * @return 200 con el veterinario, o 404 si no existe
     */
    @GetMapping("/consultar/{id}")
    ResponseEntity<Medico> consultarMedico(@PathVariable("id") Long id);
}
