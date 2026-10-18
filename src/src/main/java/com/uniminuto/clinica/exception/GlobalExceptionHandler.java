package com.uniminuto.clinica.exception;

import com.uniminuto.clinica.exception.dto.ErrorResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Traduce las excepciones del backend a respuestas HTTP coherentes con el formato de
 * {@link ErrorResponse}. Centraliza el manejo de errores para que los controladores no
 * necesiten bloques {@code try/catch} y para que nunca se exponga información técnica.
 *
 * <ul>
 *   <li>400: {@link BadRequestException}, cuerpo o parámetros mal formados.</li>
 *   <li>404: {@link ResourceNotFoundException}, ruta inexistente.</li>
 *   <li>409: {@link ConflictException}, violaciones de integridad en base de datos.</li>
 *   <li>500: cualquier error inesperado (mensaje genérico, el detalle solo se registra en el log).</li>
 * </ul>
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Construye la respuesta de error con el estado y el mensaje indicados.
     *
     * @param status  estado HTTP
     * @param mensaje mensaje para el usuario
     * @return respuesta lista para devolver
     */
    private ResponseEntity<ErrorResponse> responder(HttpStatus status, String mensaje) {
        return ResponseEntity.status(status)
                .body(new ErrorResponse(status.value(), status.getReasonPhrase(), mensaje));
    }

    /**
     * Solicitud inválida detectada por las reglas de negocio o validaciones.
     *
     * @param ex excepción lanzada por la capa de servicio
     * @return respuesta 400
     */
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> manejarBadRequest(BadRequestException ex) {
        return responder(ex.getStatus(), ex.getMessage());
    }

    /**
     * Registro no encontrado.
     *
     * @param ex excepción lanzada por la capa de servicio
     * @return respuesta 404
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> manejarNoEncontrado(ResourceNotFoundException ex) {
        return responder(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    /**
     * Conflicto con el estado actual de los datos (cita duplicada, registro no modificable, etc.).
     *
     * @param ex excepción lanzada por la capa de servicio
     * @return respuesta 409
     */
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ErrorResponse> manejarConflicto(ConflictException ex) {
        return responder(HttpStatus.CONFLICT, ex.getMessage());
    }

    /**
     * Violación de una restricción de la base de datos (llave única o llave foránea).
     *
     * @param ex excepción de Spring Data
     * @return respuesta 409 con un mensaje genérico
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> manejarIntegridad(DataIntegrityViolationException ex) {
        log.warn("Violación de integridad de datos", ex);
        return responder(HttpStatus.CONFLICT,
                "La operación no se pudo completar porque el registro está duplicado o relacionado con otra información");
    }

    /**
     * Cuerpo JSON ilegible: sintaxis errónea, fechas con formato inválido o tipos incorrectos.
     *
     * @param ex excepción de Spring MVC
     * @return respuesta 400
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> manejarCuerpoInvalido(HttpMessageNotReadableException ex) {
        return responder(HttpStatus.BAD_REQUEST,
                "Los datos enviados no tienen un formato válido. Revise las fechas, horas y valores numéricos");
    }

    /**
     * Parámetro de ruta o de consulta con un tipo incorrecto (por ejemplo, un id no numérico).
     *
     * @param ex excepción de Spring MVC
     * @return respuesta 400
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> manejarTipoParametro(MethodArgumentTypeMismatchException ex) {
        return responder(HttpStatus.BAD_REQUEST, "El valor del parámetro '" + ex.getName() + "' no es válido");
    }

    /**
     * Error al enlazar los filtros de un listado (por ejemplo {@code page=abc}).
     *
     * @param ex excepción de enlace de datos
     * @return respuesta 400
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<ErrorResponse> manejarEnlace(BindException ex) {
        String campo = ex.getFieldError() == null ? "desconocido" : ex.getFieldError().getField();
        return responder(HttpStatus.BAD_REQUEST, "El valor del filtro '" + campo + "' no es válido");
    }

    /**
     * Falta un parámetro obligatorio de consulta.
     *
     * @param ex excepción de Spring MVC
     * @return respuesta 400
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> manejarParametroFaltante(MissingServletRequestParameterException ex) {
        return responder(HttpStatus.BAD_REQUEST, "Falta el parámetro obligatorio '" + ex.getParameterName() + "'");
    }

    /**
     * Método HTTP no permitido para la ruta solicitada.
     *
     * @param ex excepción de Spring MVC
     * @return respuesta 405
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> manejarMetodo(HttpRequestMethodNotSupportedException ex) {
        return responder(HttpStatus.METHOD_NOT_ALLOWED, "El método HTTP no está permitido para este recurso");
    }

    /**
     * Tipo de contenido no soportado (la API solo recibe JSON).
     *
     * @param ex excepción de Spring MVC
     * @return respuesta 415
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> manejarTipoContenido(HttpMediaTypeNotSupportedException ex) {
        return responder(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "El tipo de contenido debe ser application/json");
    }

    /**
     * Ruta inexistente.
     *
     * @param ex excepción de Spring MVC
     * @return respuesta 404
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> manejarRutaInexistente(NoResourceFoundException ex) {
        return responder(HttpStatus.NOT_FOUND, "El recurso solicitado no existe");
    }

    /**
     * Cualquier otro error inesperado. El detalle técnico solo se escribe en el log.
     *
     * @param ex excepción no controlada
     * @return respuesta 500 con un mensaje genérico
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> manejarInesperado(Exception ex) {
        log.error("Error inesperado", ex);
        return responder(HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocurrió un error inesperado. Intente de nuevo más tarde");
    }
}
