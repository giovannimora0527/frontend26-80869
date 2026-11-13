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

## Modulo de servicios y tarifas (Fase 3A)

- Pantalla `demo/pages/servicio`: gestiona el catalogo de servicios o
  procedimientos (consultas, banos, procedimientos) con su precio, porcentaje de
  IVA y estado activo/inactivo. Permite crear, editar y activar/inactivar sin
  borrar fisicamente.
- Muestra el historial de cambios de tarifa de cada servicio (log de tarifas),
  util para evidenciar la trazabilidad de precios.
- Servicio `servicio.service.ts`: consume el modulo `/servicio` del backend
  (`listar`, `guardar`, `actualizar`, `historial-tarifas`).
- Ruta: `/inicio/servicios`. Menu con code `servicios`.

## Modulo de formulas medicas (Fase 3B)

- Pantalla `demo/pages/formula`: permite registrar una formula asociada a una
  cita, agregando uno o varios medicamentos. Por cada medicamento se captura
  dosis, frecuencia, duracion, cantidad, via de administracion e indicaciones.
- Genera e imprime la formula en PDF (se abre como blob en una nueva pestana).
- Importante: formular NO descuenta inventario; el descuento real ocurre al
  confirmar el despacho (Fase 5). La pantalla refleja esa separacion.
- Servicio `formula.service.ts`: consume el modulo `/formula` del backend
  (`listar`, `guardar`, `pdf`).
- Ruta: `/inicio/formulas`. Menu con code `formulas`.

## Modulo de facturacion (Fase 3D)

- Pantalla `demo/pages/facturacion`: genera facturas a partir de una cita
  atendida, agregando items de tipo servicio o medicamento. Calcula subtotal,
  IVA, descuento y total, conservando los valores historicamente.
- Permite registrar pagos (que actualizan el estado: PENDIENTE, PAGO_PARCIAL,
  PAGADA), anular una factura sin eliminar registros y descargar la factura en
  PDF.
- Muestra el estado de pago, el total pagado y el saldo pendiente de cada
  factura.
- Servicio `facturacion.service.ts`: consume el modulo `/factura` del backend
  (`listar`, `obtener`, `generar`, `registrar-pago`, `anular`, `pdf`).
- Ruta: `/inicio/facturacion`. Menu con code `facturacion`.

## Modulo de reportes (Fase 4)

- Pantalla `demo/pages/reportes`: una sola pantalla con tres pestanas
  (Financieros, Inventario, Gestion medica). En cada pestana se elige el tipo de
  reporte y el rango de fechas, se genera una vista previa en pantalla y se
  exporta a PDF o Excel.
- Los reportes de inventario que reflejan el estado actual (existencias, valor,
  agotados, por vencer, vencidos) muestran el selector de fechas deshabilitado,
  con una nota aclaratoria, porque corresponden a una foto del momento.
- Servicio `reportes.service.ts`: consume el modulo `/reporte` del backend
  (`generar` para la vista previa, `pdf` y `excel` para las exportaciones como
  blob).
- Acceso restringido a los perfiles Administrador, Contable y JEFE_BODEGA; el
  menu solo aparece para esos perfiles y el backend valida el acceso.
- Ruta: `/inicio/reportes`. Menu con code `reportes`.

## Modulo de despacho (Fase 5)

- Pantalla `demo/pages/despacho` con dos pestanas:
  - Pendientes: formulas pendientes de dispensacion. Al seleccionar una, se
    visualizan sus medicamentos con la existencia disponible y se registran las
    cantidades a entregar.
  - Historial: despachos realizados, con su estado y la descarga del comprobante
    en PDF.
- La confirmacion descuenta el inventario por lotes (politica FEFO, vencimiento
  mas proximo primero), admite entregas parciales y no permite dispensar lotes
  vencidos. El inventario solo se afecta al confirmar.
- Servicio `despacho.service.ts`: consume el modulo `/despacho` del backend
  (`formulas-pendientes`, `confirmar`, `listar`, `comprobante`).
- Acceso restringido a los perfiles DESPACHO_MEDICO y Administrador; el menu
  solo aparece para esos perfiles y el backend valida el acceso.
- Ruta: `/inicio/despacho`. Menu con code `despacho`.

## Organizacion del menu lateral

El menu se organiza en grupos ("cajitas") definidos en
`theme/layout/admin/navigation/navigation.ts`: Agenda, Mi Clinica, Inventario y
despacho, Gestion y Administracion. Cada item conserva su identificador (code),
con el que el filtro por `perfil_menu` decide si se muestra al rol autenticado;
un grupo aparece solo si el rol tiene permiso de al menos uno de sus items. Los
detalles de la identidad visual estan en `estetica-identidad.md`.

## Nota de alcance de la edicion de perfil

La edicion de perfil se limita al nombre de usuario y al correo (Opcion A). Los
datos personales de contacto residen en las entidades Cliente o Medico, por lo
que no se gestionan desde esta pantalla para no duplicar informacion.
