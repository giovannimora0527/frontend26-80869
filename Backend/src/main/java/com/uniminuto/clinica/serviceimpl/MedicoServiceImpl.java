package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.models.MedicoConEspecializacionRS;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.service.MedicoService;
import com.uniminuto.clinica.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicoServiceImpl implements MedicoService {

    /**
     * Repositorio para acceder a los datos de (Medico).
     * */

    @Autowired
    private MedicoRepository medicoRepository;

    /**
     * Se apoya en la relación ManyToOne de (Medico) hacia
     * (Especializacion) para obtener los datos de la especializaciónn
     * sin necesidad de una consulta adicional.
     */
    @Override
    public List<MedicoConEspecializacionRS> listarConEspecializacion() throws BadRequestException {
        return medicoRepository.findAll()
                .stream()
                .map(this::convertirARS)
                .collect(Collectors.toList());
    }

    /**
     * Convierte una entidad (Medico) en su DTO de salida, "aplanando"
     * los datos de la especialización asociada.
     */
    private MedicoConEspecializacionRS convertirARS(Medico medico) {
        MedicoConEspecializacionRS rs = new MedicoConEspecializacionRS();
        rs.setId(medico.getId());
        rs.setNombres(medico.getNombres());
        rs.setApellidos(medico.getApellidos());
        rs.setNumeroDocumento(medico.getNumeroDocumento());
        rs.setRegistroProfesional(medico.getRegistroProfesional());
        rs.setEspecializacionNombre(medico.getEspecializacion().getNombre());
        rs.setEspecializacionCodigo(medico.getEspecializacion().getCodigoEspecializacion());
        return rs;
    }
}
