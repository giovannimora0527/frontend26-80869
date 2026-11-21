package com.uniminuto.clinica.api;

import com.uniminuto.clinica.models.AsociarPersonaRq;
import com.uniminuto.clinica.models.CambiarContrasenaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.OlvideContrasenaRq;
import com.uniminuto.clinica.models.PerfilRS;
import com.uniminuto.clinica.models.PerfilRq;
import com.uniminuto.clinica.models.RegistroRq;
import com.uniminuto.clinica.models.RestablecerContrasenaRq;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * API REST de la cuenta de usuario.
 * <p>
 * Públicas (no piden token): {@code /registro}, {@code /olvide-contrasena} y
 * {@code /restablecer-contrasena}. El resto exige sesión; el id del usuario sale del
 * token (atributo {@code usuarioId}), nunca de lo que envíe el cliente.
 */
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/cuenta")
public interface CuentaApi {

    /** Registro público: crea el cliente y su usuario (400 datos inválidos; 409 duplicados). */
    @PostMapping(value = "/registro", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> registrar(@RequestBody RegistroRq registroRq);

    /** Envía un código de recuperación al correo (responde igual exista o no la cuenta). */
    @PostMapping(value = "/olvide-contrasena", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> olvideContrasena(@RequestBody OlvideContrasenaRq rq);

    /** Pone una contraseña nueva con el código recibido (400 si el código no sirve). */
    @PostMapping(value = "/restablecer-contrasena", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> restablecerContrasena(@RequestBody RestablecerContrasenaRq rq);

    /** Cambia la contraseña de quien tiene sesión iniciada. */
    @PutMapping(value = "/cambiar-contrasena", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> cambiarContrasena(@RequestAttribute("usuarioId") Long usuarioId,
                                                    @RequestBody CambiarContrasenaRq rq);

    /** Consulta el perfil de quien tiene sesión iniciada. */
    @GetMapping(value = "/perfil", produces = {"application/json"})
    ResponseEntity<PerfilRS> obtenerPerfil(@RequestAttribute("usuarioId") Long usuarioId);

    /** Actualiza los datos de perfil de quien tiene sesión iniciada. */
    @PutMapping(value = "/perfil", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> actualizarPerfil(@RequestAttribute("usuarioId") Long usuarioId,
                                                   @RequestBody PerfilRq rq);

    /** Vincula un usuario con un cliente o un médico (solo administrador). */
    @PutMapping(value = "/asociar-persona", produces = {"application/json"}, consumes = {"application/json"})
    ResponseEntity<MiRespuestaRS> asociarPersona(@RequestBody AsociarPersonaRq rq);
}
