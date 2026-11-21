package com.uniminuto.clinica.apicontroller;

import com.uniminuto.clinica.api.CuentaApi;
import com.uniminuto.clinica.models.AsociarPersonaRq;
import com.uniminuto.clinica.models.CambiarContrasenaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.OlvideContrasenaRq;
import com.uniminuto.clinica.models.PerfilRS;
import com.uniminuto.clinica.models.PerfilRq;
import com.uniminuto.clinica.models.RegistroRq;
import com.uniminuto.clinica.models.RestablecerContrasenaRq;
import com.uniminuto.clinica.service.CuentaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador de la cuenta de usuario; solo delega en {@link CuentaService}.
 */
@RestController
public class CuentaApiController implements CuentaApi {

    private final CuentaService cuentaService;

    /**
     * Crea el controlador.
     *
     * @param cuentaService servicio con las reglas de la cuenta.
     */
    public CuentaApiController(CuentaService cuentaService) {
        this.cuentaService = cuentaService;
    }

    @Override
    public ResponseEntity<MiRespuestaRS> registrar(RegistroRq registroRq) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cuentaService.registrar(registroRq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> olvideContrasena(OlvideContrasenaRq rq) {
        return ResponseEntity.ok(cuentaService.solicitarRecuperacion(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> restablecerContrasena(RestablecerContrasenaRq rq) {
        return ResponseEntity.ok(cuentaService.restablecerContrasena(rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> cambiarContrasena(Long usuarioId, CambiarContrasenaRq rq) {
        return ResponseEntity.ok(cuentaService.cambiarContrasena(usuarioId, rq));
    }

    @Override
    public ResponseEntity<PerfilRS> obtenerPerfil(Long usuarioId) {
        return ResponseEntity.ok(cuentaService.obtenerPerfil(usuarioId));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> actualizarPerfil(Long usuarioId, PerfilRq rq) {
        return ResponseEntity.ok(cuentaService.actualizarPerfil(usuarioId, rq));
    }

    @Override
    public ResponseEntity<MiRespuestaRS> asociarPersona(AsociarPersonaRq rq) {
        return ResponseEntity.ok(cuentaService.asociarPersona(rq));
    }
}
