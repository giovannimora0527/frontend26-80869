package com.uniminuto.clinica.service;

import com.uniminuto.clinica.models.AsociarPersonaRq;
import com.uniminuto.clinica.models.CambiarContrasenaRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.OlvideContrasenaRq;
import com.uniminuto.clinica.models.PerfilRS;
import com.uniminuto.clinica.models.PerfilRq;
import com.uniminuto.clinica.models.RegistroRq;
import com.uniminuto.clinica.models.RestablecerContrasenaRq;

/**
 * Servicios de la cuenta de usuario: registro, recuperación y cambio de contraseña,
 * perfil y asociación del usuario con una persona (cliente o médico).
 */
public interface CuentaService {

    /**
     * Registra a una persona nueva: crea su ficha de cliente y su usuario en un solo paso.
     *
     * @param rq datos del registro.
     * @return mensaje de éxito (201).
     */
    MiRespuestaRS registrar(RegistroRq rq);

    /**
     * Envía al correo un código para recuperar la contraseña. Siempre responde lo mismo,
     * exista o no la cuenta, para no revelar qué usuarios están registrados.
     *
     * @param rq usuario o correo de la cuenta.
     * @return mensaje general.
     */
    MiRespuestaRS solicitarRecuperacion(OlvideContrasenaRq rq);

    /**
     * Pone una contraseña nueva si el código recibido por correo es correcto y está vigente.
     *
     * @param rq usuario o correo, código y contraseña nueva.
     * @return mensaje de éxito.
     */
    MiRespuestaRS restablecerContrasena(RestablecerContrasenaRq rq);

    /**
     * Cambia la contraseña de quien ya inició sesión; exige la contraseña actual.
     *
     * @param usuarioId id del usuario que viene en el token.
     * @param rq        contraseña actual y contraseña nueva.
     * @return mensaje de éxito.
     */
    MiRespuestaRS cambiarContrasena(Long usuarioId, CambiarContrasenaRq rq);

    /**
     * Consulta el perfil de quien inició sesión.
     *
     * @param usuarioId id del usuario que viene en el token.
     * @return datos de la cuenta y de la persona asociada, si la tiene.
     */
    PerfilRS obtenerPerfil(Long usuarioId);

    /**
     * Actualiza los datos de perfil que la persona puede cambiar por sí misma.
     *
     * @param usuarioId id del usuario que viene en el token.
     * @param rq        datos nuevos.
     * @return mensaje de éxito.
     */
    MiRespuestaRS actualizarPerfil(Long usuarioId, PerfilRq rq);

    /**
     * Vincula un usuario con un cliente o un médico (solo administrador).
     *
     * @param rq usuario, tipo de persona e id de la persona.
     * @return mensaje de éxito.
     */
    MiRespuestaRS asociarPersona(AsociarPersonaRq rq);
}
