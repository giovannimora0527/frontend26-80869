package com.uniminuto.clinica.service;

public interface EmailService {

    /**
     * Envia el codigo OTP al correo del usuario.
     */
    void enviarOtp(String destino, String username, String codigo, int minutosVigencia);

    /**
     * Envia al correo el codigo para recuperar la contraseña.
     */
    void enviarRecuperacion(String destino, String username, String codigo, int minutosVigencia);
}
