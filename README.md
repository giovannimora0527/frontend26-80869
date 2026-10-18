# Frontend – Centro Veterinario (Segundo Parcial de Programación Web)

Este paquete contiene la carpeta **`src/`** del proyecto Angular corregida y completada. Reemplace/combine su `src/` con esta
(el `package.json` y `angular.json` del proyecto no cambian; no se agregan dependencias nuevas). Requiere el backend
corregido corriendo en `http://localhost:8080/clinica/v1`.

## 1. Módulos del parcial

| Pantalla | Ruta (menú) | Componente |
|---|---|---|
| Citas | `/citas` | `demo/pages/cita` |
| Historias clínicas (+ anotaciones) | `/historias-clinicas` | `demo/pages/historia-clinica` y su hijo `anotaciones-historia` |
| Fórmulas médicas | `/formulas-medicas` | `demo/pages/formula-medica` |

Cada módulo cumple los puntos del parcial:

* **DataTable con paginación, filtros y orden en el servidor** (clase base `utils/tabla-servidor.ts`; controles
  `shared/paginador` y `shared/orden-th`). Los filtros de texto usan *debounce* de 350 ms y una respuesta vieja nunca
  reemplaza a una más reciente.
* **Listado resumido vs. detalle**: la tabla usa `GET .../paginado` (datos resumidos); el botón **Ver** abre un modal que pide
  `GET .../consultar/{id}`. En historias, el modal incluye el DataTable de **anotaciones** (paginado, filtrable y ordenable).
* **Formularios reactivos** (`FormBuilder`) con validaciones y mensajes por campo; el backend sigue siendo la autoridad y su
  mensaje exacto se muestra en el formulario si rechaza algo (disponibilidad del veterinario, cita duplicada, estados, etc.).
* **Combos dependientes**: Cliente → Mascota (citas, historias, fórmulas y filtros) y Mascota → Cita (historias: solo citas
  *Atendidas*; fórmulas: citas no canceladas). Los combos hijos permanecen deshabilitados hasta elegir el padre.
* **Estados de carga** (spinner en tabla, detalle, combos y botón de guardar, que además evita envíos dobles) y **mensajes
  claros** de éxito/error (SweetAlert2 para acciones; alerta dentro del modal para errores de formulario; "Reintentar" si
  falla un listado; mensaje específico si no hay conexión).
* **Acciones explícitas**: citas se *cancelan/reactivan* (no se borran), fórmulas se *inactivan*, historias se *cierran*;
  todas piden confirmación. Las anotaciones solo se agregan (no se editan ni eliminan).

## 2. Arquitectura

```
app/
  models/      Tipos TypeScript de cada entidad, filtros, Pagina<T> y RespuestaEscritura (cita, historia, anotación, fórmula...)
  services/    Un servicio por recurso del backend; BackendService ahora incluye patch()
  utils/       tabla-servidor, params, error, fecha, alertas, modal (lógica reutilizable sin duplicar)
  shared/      paginador y encabezado ordenable (componentes standalone)
  demo/pages/  Pantallas: cita, historia-clinica (+ anotaciones-historia), formula-medica, mascota, usuario...
```

## 3. Cambios respecto al código original

* Eliminadas las pantallas antiguas `app/views/*` (paginación en el cliente, formularios con IDs a mano, `confirm()`).
* `app-routing.module.ts` / `navigation.ts`: nuevas rutas y menú (`/citas`, `/historias-clinicas`, `/formulas-medicas`);
  `/formula-medica` redirige a la nueva ruta.
* Servicios ajustados al nuevo contrato del backend: `PUT /cita/actualizar/{id}`, `PATCH /cita/cancelar/{id}`,
  `PATCH /formula-medica/inactivar/{id}`, `PUT /mascota/actualizar/{id}`, etc.
* `MascotaService.actualizarMascota` usa `PUT .../actualizar/{id}`; el error de guardado de mascotas muestra el mensaje del backend.
* `environment.prod.ts` ahora define `apiUrl` y `apiUrlAuth` (antes faltaban y fallaba la build de producción).
* Se agregó `GET /raza/listar` al backend (el combo de razas lo necesitaba y no existía).

## 4. Verificación

No fue posible instalar Angular en el entorno de preparación (el registro de paquetes npm estaba bloqueado), por lo que **el
proyecto no se compiló**. Se verificó la sintaxis TypeScript de todos los archivos y la coherencia plantilla ↔ componente.
Compile con `ng build` o `ng serve`; si aparece algún error de tipos de plantilla, suele resolverse en una línea.
