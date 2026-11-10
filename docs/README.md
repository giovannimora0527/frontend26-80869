# Documentacion tecnica - Frontend Clinica Veterinaria

Esta carpeta concentra la documentacion tecnica del frontend (Angular 19,
plantilla Datta Able + Bootstrap 5): decisiones de arquitectura, manejo de
autenticacion y notas de cada fase del desarrollo.

## Autenticacion y control de acceso (Fase 0)

- Interceptor `auth.interceptor.ts`: adjunta el token JWT en la cabecera
  `Authorization` de cada peticion y maneja de forma centralizada las
  respuestas 401 (sesion expirada; redirige al login) y 403 (sin permisos),
  mostrando mensajes claros al usuario.
- El interceptor se registra en `app-config.ts` mediante `withInterceptors`.
- Guard `auth.guard.ts`: permite el acceso solo si el token existe y esta
  vigente (no expirado).
- Guard `role.guard.ts`: restringe rutas por rol usando `data.roles`. Se
  utilizara en las fases que incorporen modulos con acceso restringido.
- Utilidades de token en `utils/jwt.util.ts`: lectura de rol, identificador de
  usuario y verificacion de vigencia del token.

## Gestion del perfil (Fase 0)

- Pantalla `demo/pages/perfil`: permite editar el nombre de usuario y el correo,
  y cambiar la contrasena. Ruta: `/inicio/perfil`.
- La barra superior (`nav-right`) muestra el usuario autenticado leido del JWT
  y ofrece accesos a Mi perfil y a Cerrar sesion.
- El cierre de sesion invoca el endpoint `/auth/cerrar-sesion` del backend y
  limpia la sesion local.

## Modulo de inventario (Fase 1)

- Pantalla `demo/pages/inventario` con dos pestanas:
  - Inventario: tabla de medicamentos con existencia e indicadores de estado
    (agotado, stock bajo, proximo a vencer, vencido), filtros rapidos y
    formulario para crear o editar.
  - Carga masiva: subida de archivo Excel/CSV, vista previa con el informe de
    errores por fila (numero de fila y motivo) y confirmacion de la importacion.
- Servicio `inventario.service.ts`: consume los endpoints del modulo
  `/inventario`, incluida la subida de archivos mediante FormData.
- Ruta: `/inicio/inventario`. Menu con code `inventario`.

## Modulo de calendario de citas (Fase 2)

- Pantalla `demo/pages/calendario`: calendario con FullCalendar, con vistas de
  mes, semana y dia. Las citas se muestran como eventos coloreados segun su
  estado.
- Un medico ve unicamente sus citas (el backend filtra por su vinculo); los
  demas roles ven todas.
- Al hacer clic en una cita se muestra su detalle y las acciones disponibles:
  confirmar, atender, reprogramar y cancelar. Boton para descargar el reporte
  en Excel del rango visible.
- Servicio `calendario.service.ts`: consume el modulo `/calendario`; la descarga
  del reporte usa HttpClient con responseType blob.
- Dependencias: `@fullcalendar/angular`, `@fullcalendar/core`,
  `@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/interaction`
  (version 6.1.19).
- Ruta: `/inicio/calendario`. Menu con code `calendario`.

## Nota de alcance de la edicion de perfil

La edicion de perfil se limita al nombre de usuario y al correo (Opcion A). Los
datos personales de contacto residen en las entidades Cliente o Medico, por lo
que no se gestionan desde esta pantalla para no duplicar informacion.
