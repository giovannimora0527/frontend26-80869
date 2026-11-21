package com.uniminuto.clinica.serviceimpl;

import com.uniminuto.clinica.entity.Cliente;
import com.uniminuto.clinica.entity.Medico;
import com.uniminuto.clinica.entity.RecuperacionClave;
import com.uniminuto.clinica.entity.Usuario;
import com.uniminuto.clinica.exception.BadRequestException;
import com.uniminuto.clinica.exception.ConflictException;
import com.uniminuto.clinica.exception.NotFoundException;
import com.uniminuto.clinica.models.AsociarPersonaRq;
import com.uniminuto.clinica.models.CambiarContrasenaRq;
import com.uniminuto.clinica.models.ClienteRq;
import com.uniminuto.clinica.models.MiRespuestaRS;
import com.uniminuto.clinica.models.OlvideContrasenaRq;
import com.uniminuto.clinica.models.PerfilRS;
import com.uniminuto.clinica.models.PerfilRq;
import com.uniminuto.clinica.models.RegistroRq;
import com.uniminuto.clinica.models.RestablecerContrasenaRq;
import com.uniminuto.clinica.repository.ClienteRepository;
import com.uniminuto.clinica.repository.MedicoRepository;
import com.uniminuto.clinica.repository.PerfilRepository;
import com.uniminuto.clinica.repository.RecuperacionClaveRepository;
import com.uniminuto.clinica.repository.UsuarioRepository;
import com.uniminuto.clinica.service.ClienteService;
import com.uniminuto.clinica.service.CuentaService;
import com.uniminuto.clinica.service.EmailService;
import com.uniminuto.clinica.utils.PasswordUtils;
import com.uniminuto.clinica.utils.TextoUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;

/**
 * Implementación de las reglas de negocio de la cuenta de usuario.
 * <p>
 * Las reglas de validación viven aquí (backend); el frontend solo las refleja.
 * Para no repetir reglas, el registro y la edición del perfil de un cliente se apoyan
 * en {@link ClienteService}, que ya valida documento, fecha de nacimiento, teléfono, etc.
 */
@Service
public class CuentaServiceImpl implements CuentaService {

    /** Registro de eventos; el detalle técnico queda solo en el log del servidor. */
    private static final Logger LOG = LoggerFactory.getLogger(CuentaServiceImpl.class);

    /** Id del perfil Médico. */
    private static final int ROL_MEDICO = 3;
    /** Id del perfil Cliente (el que reciben quienes se registran solos). */
    private static final int ROL_CLIENTE = 4;

    private static final String TIPO_CLIENTE = "CLIENTE";
    private static final String TIPO_MEDICO = "MEDICO";

    /** Usuario: 4 a 30 caracteres en minúscula, números, punto, guion o guion bajo. */
    private static final Pattern PATRON_USERNAME = Pattern.compile("^[a-z0-9._-]{4,30}$");
    /** Correo con forma básica nombre@dominio.ext. */
    private static final Pattern PATRON_EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    /** Teléfono: entre 7 y 20 caracteres entre dígitos, +, - y espacios. */
    private static final Pattern PATRON_TELEFONO = Pattern.compile("^[0-9+\\-\\s]{7,20}$");

    private static final int PASSWORD_MIN = 8;
    private static final int PASSWORD_MAX = 100;

    private static final String MSG_RECUPERACION =
            "Si los datos corresponden a una cuenta activa, enviamos un código al correo registrado.";
    private static final String MSG_CODIGO_INVALIDO =
            "El código no es válido o ya venció. Solicita uno nuevo.";

    private final UsuarioRepository usuarioRepository;
    private final PerfilRepository perfilRepository;
    private final ClienteRepository clienteRepository;
    private final MedicoRepository medicoRepository;
    private final RecuperacionClaveRepository recuperacionRepository;
    private final ClienteService clienteService;
    private final EmailService emailService;

    /** Minutos que dura vigente el código de recuperación. */
    @Value("${app.recuperacion.expiracion-minutos:10}")
    private int expiracionMinutos;

    /** Intentos fallidos permitidos con un mismo código. */
    @Value("${app.recuperacion.max-intentos:3}")
    private int maxIntentos;

    private final SecureRandom random = new SecureRandom();

    /**
     * Crea el servicio con sus dependencias.
     *
     * @param usuarioRepository      repositorio de usuarios.
     * @param perfilRepository       repositorio de perfiles de acceso.
     * @param clienteRepository      repositorio de clientes.
     * @param medicoRepository       repositorio de médicos.
     * @param recuperacionRepository repositorio de códigos de recuperación.
     * @param clienteService         servicio de clientes (reutiliza sus validaciones).
     * @param emailService           envío de correos.
     */
    public CuentaServiceImpl(UsuarioRepository usuarioRepository,
                             PerfilRepository perfilRepository,
                             ClienteRepository clienteRepository,
                             MedicoRepository medicoRepository,
                             RecuperacionClaveRepository recuperacionRepository,
                             ClienteService clienteService,
                             EmailService emailService) {
        this.usuarioRepository = usuarioRepository;
        this.perfilRepository = perfilRepository;
        this.clienteRepository = clienteRepository;
        this.medicoRepository = medicoRepository;
        this.recuperacionRepository = recuperacionRepository;
        this.clienteService = clienteService;
        this.emailService = emailService;
    }

    // ------------------------------------------------------------- registro

    @Override
    @Transactional
    public MiRespuestaRS registrar(RegistroRq rq) {
        if (rq == null) {
            throw new BadRequestException("La información del registro es obligatoria.");
        }
        String username = limpiar(rq.getUsername());
        if (username == null || !PATRON_USERNAME.matcher(username.toLowerCase(Locale.ROOT)).matches()) {
            throw new BadRequestException("El usuario debe tener entre 4 y 30 caracteres: "
                    + "letras, números, punto, guion o guion bajo.");
        }
        username = username.toLowerCase(Locale.ROOT);
        String email = validarCorreo(rq.getEmail());
        validarContrasena(rq.getPassword());

        if (usuarioRepository.existsByUsernameIgnoreCase(username)) {
            throw new ConflictException("Ya existe un usuario con el nombre de usuario proporcionado.");
        }
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("Ya existe un usuario con el correo proporcionado.");
        }
        if (!perfilRepository.existsById(ROL_CLIENTE)) {
            LOG.error("Falta el perfil Cliente (id {}) en la tabla perfil; el registro no puede continuar.",
                    ROL_CLIENTE);
            throw new BadRequestException("El registro no está disponible en este momento.");
        }

        // La ficha de cliente se crea con las reglas que ya existen (documento, edad, teléfono...).
        ClienteRq clienteRq = new ClienteRq();
        clienteRq.setTipoDocumento(rq.getTipoDocumento());
        clienteRq.setNumeroDocumento(rq.getNumeroDocumento());
        clienteRq.setNombres(TextoUtil.nombrePropio(rq.getNombres()));
        clienteRq.setApellidos(TextoUtil.nombrePropio(rq.getApellidos()));
        clienteRq.setFechaNacimiento(rq.getFechaNacimiento());
        clienteRq.setGenero(rq.getGenero());
        clienteRq.setTelefono(rq.getTelefono());
        clienteRq.setDireccion(rq.getDireccion());
        // Si el documento ya existe, lanza 409: esa persona debe pedir en la clínica que le asocien el usuario.
        clienteService.crearCliente(clienteRq);
        Cliente cliente = clienteRepository.findByNumeroDocumento(clienteRq.getNumeroDocumento().trim())
                .orElseThrow(() -> new IllegalStateException("El cliente recién creado no se encontró."));

        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setEmail(email);
        usuario.setRol(ROL_CLIENTE);
        usuario.setPasswordHash(PasswordUtils.generateMd5(rq.getPassword()));
        usuario.setActivo(Boolean.TRUE);
        usuario.setFechaCreacion(LocalDateTime.now());
        usuarioRepository.saveAndFlush(usuario);

        cliente.setUsuarioId(usuario.getId().intValue());
        clienteRepository.save(cliente);
        return respuesta(201, "Registro exitoso. Ya puedes iniciar sesión.");
    }

    // ------------------------------------------------ recordar contraseña

    @Override
    @Transactional
    public MiRespuestaRS solicitarRecuperacion(OlvideContrasenaRq rq) {
        if (rq == null || esVacio(rq.getIdentificador())) {
            throw new BadRequestException("Escribe tu usuario o tu correo electrónico.");
        }
        Optional<Usuario> encontrado = buscarPorIdentificador(rq.getIdentificador());
        if (encontrado.isPresent() && Boolean.TRUE.equals(encontrado.get().getActivo())) {
            Usuario usuario = encontrado.get();
            invalidarCodigosPendientes(usuario.getId());

            String codigo = String.format("%06d", random.nextInt(1_000_000));
            LocalDateTime ahora = LocalDateTime.now();
            RecuperacionClave clave = new RecuperacionClave();
            clave.setUsuarioId(usuario.getId());
            clave.setCodigo(codigo);
            clave.setFechaCreacion(ahora);
            clave.setFechaExpiracion(ahora.plusMinutes(expiracionMinutos));
            clave.setIntentos(0);
            clave.setUsado(false);
            recuperacionRepository.save(clave);
            try {
                emailService.enviarRecuperacion(usuario.getEmail(), usuario.getUsername(), codigo, expiracionMinutos);
            } catch (BadRequestException e) {
                // No se informa al cliente: así no se puede saber qué cuentas existen.
                LOG.warn("No se pudo enviar el código de recuperación al usuario {}", usuario.getId());
            }
        }
        return respuesta(200, MSG_RECUPERACION);
    }

    // noRollbackFor: para que se guarden los intentos fallidos aunque se lance el error.
    @Override
    @Transactional(noRollbackFor = BadRequestException.class)
    public MiRespuestaRS restablecerContrasena(RestablecerContrasenaRq rq) {
        if (rq == null || esVacio(rq.getIdentificador()) || esVacio(rq.getCodigo())
                || esVacio(rq.getNuevaContrasena())) {
            throw new BadRequestException("El usuario o correo, el código y la contraseña nueva son obligatorios.");
        }
        // Se valida primero la contraseña para no "gastar" el código por una clave débil.
        validarContrasena(rq.getNuevaContrasena());

        Usuario usuario = buscarPorIdentificador(rq.getIdentificador())
                .filter(u -> Boolean.TRUE.equals(u.getActivo()))
                .orElseThrow(() -> new BadRequestException(MSG_CODIGO_INVALIDO));
        RecuperacionClave clave = recuperacionRepository
                .findTopByUsuarioIdAndUsadoFalseOrderByFechaCreacionDesc(usuario.getId())
                .orElseThrow(() -> new BadRequestException(MSG_CODIGO_INVALIDO));

        if (clave.getFechaExpiracion().isBefore(LocalDateTime.now()) || clave.getIntentos() >= maxIntentos) {
            clave.setUsado(true);
            recuperacionRepository.save(clave);
            throw new BadRequestException(MSG_CODIGO_INVALIDO);
        }
        boolean coincide = MessageDigest.isEqual(
                clave.getCodigo().getBytes(StandardCharsets.UTF_8),
                rq.getCodigo().trim().getBytes(StandardCharsets.UTF_8));
        if (!coincide) {
            clave.setIntentos(clave.getIntentos() + 1);
            recuperacionRepository.save(clave);
            throw new BadRequestException(MSG_CODIGO_INVALIDO);
        }

        String nuevoHash = PasswordUtils.generateMd5(rq.getNuevaContrasena());
        if (nuevoHash.equalsIgnoreCase(usuario.getPasswordHash())) {
            throw new BadRequestException("La contraseña nueva debe ser diferente a la actual.");
        }
        usuario.setPasswordHash(nuevoHash);
        usuarioRepository.save(usuario);
        invalidarCodigosPendientes(usuario.getId());
        return respuesta(200, "Contraseña actualizada correctamente. Ya puedes iniciar sesión.");
    }

    // --------------------------------------------- cambiar contraseña (logueado)

    @Override
    @Transactional
    public MiRespuestaRS cambiarContrasena(Long usuarioId, CambiarContrasenaRq rq) {
        Usuario usuario = obtenerUsuarioActivo(usuarioId);
        if (rq == null || esVacio(rq.getContrasenaActual()) || esVacio(rq.getNuevaContrasena())) {
            throw new BadRequestException("La contraseña actual y la nueva son obligatorias.");
        }
        String hashActual = PasswordUtils.generateMd5(rq.getContrasenaActual());
        if (usuario.getPasswordHash() == null || !usuario.getPasswordHash().equalsIgnoreCase(hashActual)) {
            throw new BadRequestException("La contraseña actual no es correcta.");
        }
        validarContrasena(rq.getNuevaContrasena());
        String nuevoHash = PasswordUtils.generateMd5(rq.getNuevaContrasena());
        if (nuevoHash.equalsIgnoreCase(usuario.getPasswordHash())) {
            throw new BadRequestException("La contraseña nueva debe ser diferente a la actual.");
        }
        usuario.setPasswordHash(nuevoHash);
        usuarioRepository.save(usuario);
        return respuesta(200, "Contraseña cambiada correctamente.");
    }

    // ----------------------------------------------------------------- perfil

    @Override
    public PerfilRS obtenerPerfil(Long usuarioId) {
        Usuario usuario = obtenerUsuarioActivo(usuarioId);
        PerfilRS rs = new PerfilRS();
        rs.setUsuarioId(usuario.getId());
        rs.setUsername(usuario.getUsername());
        rs.setEmail(usuario.getEmail());
        rs.setRol(usuario.getRol());
        perfilRepository.findById(usuario.getRol()).ifPresent(p -> rs.setPerfil(p.getNombre()));

        Optional<Cliente> cliente = clienteRepository.findByUsuarioId(usuario.getId().intValue());
        if (cliente.isPresent()) {
            Cliente c = cliente.get();
            rs.setTipoPersona(TIPO_CLIENTE);
            rs.setPersonaId(c.getId());
            rs.setTipoDocumento(c.getTipoDocumento());
            rs.setNumeroDocumento(c.getNumeroDocumento());
            rs.setNombres(c.getNombres());
            rs.setApellidos(c.getApellidos());
            rs.setTelefono(c.getTelefono());
            rs.setDireccion(c.getDireccion());
            return rs;
        }
        medicoRepository.findByUsuarioId(usuario.getId()).ifPresent(m -> {
            rs.setTipoPersona(TIPO_MEDICO);
            rs.setPersonaId(m.getId());
            rs.setTipoDocumento(m.getTipoDocumento());
            rs.setNumeroDocumento(m.getNumeroDocumento());
            rs.setNombres(m.getNombres());
            rs.setApellidos(m.getApellidos());
            rs.setTelefono(m.getTelefono());
        });
        return rs;
    }

    @Override
    @Transactional
    public MiRespuestaRS actualizarPerfil(Long usuarioId, PerfilRq rq) {
        Usuario usuario = obtenerUsuarioActivo(usuarioId);
        if (rq == null) {
            throw new BadRequestException("La información del perfil es obligatoria.");
        }
        String email = validarCorreo(rq.getEmail());
        if (usuarioRepository.existsByEmailIgnoreCaseAndIdNot(email, usuario.getId())) {
            throw new ConflictException("Ya existe otro usuario con el correo proporcionado.");
        }

        Optional<Cliente> cliente = clienteRepository.findByUsuarioId(usuario.getId().intValue());
        if (cliente.isPresent()) {
            actualizarCliente(cliente.get(), rq);
        } else {
            medicoRepository.findByUsuarioId(usuario.getId())
                    .ifPresent(medico -> actualizarMedico(medico, rq));
        }
        usuario.setEmail(email);
        usuarioRepository.save(usuario);
        return respuesta(200, "Perfil actualizado correctamente.");
    }

    // ---------------------------------------------------- asociar a persona

    @Override
    @Transactional
    public MiRespuestaRS asociarPersona(AsociarPersonaRq rq) {
        if (rq == null || rq.getUsuarioId() == null || rq.getPersonaId() == null || esVacio(rq.getTipoPersona())) {
            throw new BadRequestException("El usuario, el tipo de persona y la persona son obligatorios.");
        }
        Usuario usuario = usuarioRepository.findById(rq.getUsuarioId())
                .orElseThrow(() -> new NotFoundException("El usuario con el id proporcionado no existe."));
        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new ConflictException("El usuario está inactivo.");
        }
        if (clienteRepository.existsByUsuarioId(usuario.getId().intValue())
                || medicoRepository.existsByUsuarioId(usuario.getId())) {
            throw new ConflictException("El usuario ya está asociado a una persona.");
        }

        String tipo = rq.getTipoPersona().trim().toUpperCase(Locale.ROOT);
        if (TIPO_CLIENTE.equals(tipo)) {
            if (usuario.getRol() != ROL_CLIENTE) {
                throw new ConflictException("Para asociar un cliente, el usuario debe tener el perfil Cliente.");
            }
            Cliente cliente = clienteRepository.findById(rq.getPersonaId())
                    .orElseThrow(() -> new NotFoundException("No existe un cliente con el id " + rq.getPersonaId() + "."));
            if (cliente.getUsuarioId() != null) {
                throw new ConflictException("Ese cliente ya tiene un usuario asociado.");
            }
            cliente.setUsuarioId(usuario.getId().intValue());
            clienteRepository.save(cliente);
        } else if (TIPO_MEDICO.equals(tipo)) {
            if (usuario.getRol() != ROL_MEDICO) {
                throw new ConflictException("Para asociar un médico, el usuario debe tener el perfil Médico.");
            }
            Medico medico = medicoRepository.findById(rq.getPersonaId())
                    .orElseThrow(() -> new NotFoundException("No existe un médico con el id " + rq.getPersonaId() + "."));
            if (medico.getUsuarioId() != null) {
                throw new ConflictException("Ese médico ya tiene un usuario asociado.");
            }
            medico.setUsuarioId(usuario.getId());
            medicoRepository.save(medico);
        } else {
            throw new BadRequestException("El tipo de persona debe ser CLIENTE o MEDICO.");
        }
        return respuesta(200, "Usuario asociado correctamente.");
    }

    // ---------------------------------------------------------------- helpers

    /** Edita nombres, apellidos, teléfono y dirección del cliente reutilizando las reglas de ClienteService. */
    private void actualizarCliente(Cliente cliente, PerfilRq rq) {
        ClienteRq clienteRq = new ClienteRq();
        // Lo que la persona no puede cambiar (documento, nacimiento, género) se conserva igual.
        clienteRq.setTipoDocumento(cliente.getTipoDocumento());
        clienteRq.setNumeroDocumento(cliente.getNumeroDocumento());
        clienteRq.setFechaNacimiento(cliente.getFechaNacimiento());
        clienteRq.setGenero(cliente.getGenero());
        clienteRq.setNombres(TextoUtil.nombrePropio(rq.getNombres()));
        clienteRq.setApellidos(TextoUtil.nombrePropio(rq.getApellidos()));
        clienteRq.setTelefono(rq.getTelefono());
        clienteRq.setDireccion(rq.getDireccion());
        clienteService.actualizarCliente(cliente.getId(), clienteRq);
    }

    /** Edita nombres, apellidos y teléfono del médico (la dirección no aplica a médicos). */
    private void actualizarMedico(Medico medico, PerfilRq rq) {
        String nombres = TextoUtil.nombrePropio(rq.getNombres());
        String apellidos = TextoUtil.nombrePropio(rq.getApellidos());
        if (nombres == null || nombres.length() > 100) {
            throw new BadRequestException("Los nombres son obligatorios y no pueden superar 100 caracteres.");
        }
        if (apellidos == null || apellidos.length() > 100) {
            throw new BadRequestException("Los apellidos son obligatorios y no pueden superar 100 caracteres.");
        }
        String telefono = limpiar(rq.getTelefono());
        if (telefono != null && !PATRON_TELEFONO.matcher(telefono).matches()) {
            throw new BadRequestException(
                    "El teléfono debe tener entre 7 y 20 caracteres (números, +, - o espacios).");
        }
        medico.setNombres(nombres);
        medico.setApellidos(apellidos);
        medico.setTelefono(telefono);
        medicoRepository.save(medico);
    }

    /** Busca por correo si el texto trae "@"; si no, por nombre de usuario. */
    private Optional<Usuario> buscarPorIdentificador(String identificador) {
        String limpio = identificador.trim();
        if (limpio.contains("@")) {
            return usuarioRepository.findFirstByEmailIgnoreCase(limpio);
        }
        return usuarioRepository.findByUsername(limpio);
    }

    /** Marca como usados todos los códigos pendientes del usuario. */
    private void invalidarCodigosPendientes(Long usuarioId) {
        List<RecuperacionClave> pendientes = recuperacionRepository.findByUsuarioIdAndUsadoFalse(usuarioId);
        for (RecuperacionClave pendiente : pendientes) {
            pendiente.setUsado(true);
        }
        recuperacionRepository.saveAll(pendientes);
    }

    /** Obtiene el usuario de la sesión y verifica que exista y esté activo. */
    private Usuario obtenerUsuarioActivo(Long usuarioId) {
        if (usuarioId == null) {
            throw new BadRequestException("No se pudo identificar al usuario de la sesión.");
        }
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotFoundException("El usuario de la sesión ya no existe."));
        if (!Boolean.TRUE.equals(usuario.getActivo())) {
            throw new BadRequestException("El usuario está inactivo. Comunícate con el administrador.");
        }
        return usuario;
    }

    /** Valida y devuelve el correo limpio y en minúscula. */
    private String validarCorreo(String correo) {
        String limpio = limpiar(correo);
        if (limpio == null || limpio.length() > 255 || !PATRON_EMAIL.matcher(limpio).matches()) {
            throw new BadRequestException("El correo electrónico es obligatorio y debe ser válido.");
        }
        return limpio.toLowerCase(Locale.ROOT);
    }

    /** Regla de contraseñas nuevas: 8 a 100 caracteres, con al menos una letra y un número. */
    private void validarContrasena(String contrasena) {
        if (contrasena == null || contrasena.length() < PASSWORD_MIN || contrasena.length() > PASSWORD_MAX) {
            throw new BadRequestException("La contraseña debe tener entre " + PASSWORD_MIN + " y "
                    + PASSWORD_MAX + " caracteres.");
        }
        boolean tieneLetra = contrasena.chars().anyMatch(Character::isLetter);
        boolean tieneNumero = contrasena.chars().anyMatch(Character::isDigit);
        if (!tieneLetra || !tieneNumero) {
            throw new BadRequestException("La contraseña debe incluir al menos una letra y un número.");
        }
    }

    /** Quita espacios al inicio y al final; devuelve {@code null} si queda vacío. */
    private String limpiar(String valor) {
        if (valor == null) {
            return null;
        }
        String recortado = valor.trim();
        return recortado.isEmpty() ? null : recortado;
    }

    private boolean esVacio(String valor) {
        return valor == null || valor.trim().isEmpty();
    }

    private MiRespuestaRS respuesta(int status, String mensaje) {
        MiRespuestaRS rta = new MiRespuestaRS();
        rta.setStatus(status);
        rta.setMessage(mensaje);
        return rta;
    }
}
