package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger LOG = LoggerFactory.getLogger(EmailServiceImpl.class);

    /** Solo existe si hay spring.mail.host configurado. */
    @Autowired
    private ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String remitente;

    /** En desarrollo imprime el codigo en la consola del backend (util si el correo falla). */
    @Value("${app.otp.mostrar-en-consola:true}")
    private boolean mostrarEnConsola;

    @Override
    public void enviarOtp(String destino, String username, String codigo, int minutosVigencia) {
        enviarCodigo("[OTP]", "Código de verificación - Clínica Veterinaria Uniminuto",
                destino, username, codigo, minutosVigencia, "Tu código de verificación es: ");
    }

    @Override
    public void enviarRecuperacion(String destino, String username, String codigo, int minutosVigencia) {
        enviarCodigo("[RECUPERACION]", "Recuperación de contraseña - Clínica Veterinaria Uniminuto",
                destino, username, codigo, minutosVigencia, "Tu código para recuperar la contraseña es: ");
    }

    /** Envia un codigo por correo (y lo imprime en consola si esta activado el modo desarrollo). */
    private void enviarCodigo(String etiqueta, String asunto, String destino, String username,
                              String codigo, int minutosVigencia, String frase) {
        if (mostrarEnConsola) {
            LOG.info("{} Usuario {} -> codigo {}", etiqueta, username, codigo);
        }

        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            LOG.warn("No hay correo configurado (spring.mail.host); el codigo no se envio por email.");
            return;
        }

        try {
            SimpleMailMessage mensaje = new SimpleMessageBuilder()
                    .de(remitente)
                    .para(destino)
                    .asunto(asunto)
                    .texto("Hola " + username + ",\n\n"
                            + frase + codigo + "\n\n"
                            + "Es válido por " + minutosVigencia + " minutos. "
                            + "Si no fuiste tú, ignora este mensaje.\n\n"
                            + "Clínica Veterinaria Uniminuto")
                    .build();
            sender.send(mensaje);
        } catch (Exception e) {
            LOG.error("Error enviando el correo con codigo", e);
            throw new BadRequestException(
                    "No fue posible enviar el código al correo. Intenta de nuevo.");
        }
    }

    /** Ayudante pequeño para armar el correo. */
    private static class SimpleMessageBuilder {
        private final SimpleMailMessage mensaje = new SimpleMailMessage();

        SimpleMessageBuilder de(String from) {
            if (from != null && !from.isBlank()) {
                mensaje.setFrom(from);
            }
            return this;
        }

        SimpleMessageBuilder para(String to) {
            mensaje.setTo(to);
            return this;
        }

        SimpleMessageBuilder asunto(String subject) {
            mensaje.setSubject(subject);
            return this;
        }

        SimpleMessageBuilder texto(String text) {
            mensaje.setText(text);
            return this;
        }

        SimpleMailMessage build() {
            return mensaje;
        }
    }
}
