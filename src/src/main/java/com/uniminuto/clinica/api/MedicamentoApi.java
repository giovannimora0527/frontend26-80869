package com.uniminuto.clinica.api;

import com.uniminuto.clinica.entity.Medicamento;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

/**
 * Contrato REST de consulta de medicamentos. Ruta base: {@code /medicamento}.
 */
public interface MedicamentoApi {

    /**
     * {@code GET /medicamento/listar}: lista los medicamentos ordenados por nombre.
     *
     * @return 200 con la lista de medicamentos
     */
    @GetMapping("/listar")
    ResponseEntity<List<Medicamento>> listarMedicamentos();
}
