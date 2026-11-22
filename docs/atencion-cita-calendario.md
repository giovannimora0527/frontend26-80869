# Atencion de cita desde el calendario (frontend)

Describe la ventana de atencion que se abre al atender una cita en el
calendario, reuniendo en un solo paso la anotacion clinica y la formula medica.

## Que cambio

Antes, al pulsar "Atender" en una cita del calendario, la cita pasaba
directamente al estado ATENDIDA y no se registraba nada mas; la anotacion y la
formula debian crearse despues en pantallas separadas.

Ahora, al pulsar "Atender" se abre una ventana de atencion que muestra los datos
de la cita (solo lectura) y permite registrar la atencion completa. La cita se
marca como ATENDIDA solo cuando se guarda correctamente.

## Donde

- Componente: `src/app/demo/pages/calendario/calendario.component.ts`.
- Servicio: `src/app/demo/pages/calendario/service/calendario.service.ts`
  (metodo `atenderCita`, consume `POST /calendario/atender-cita`).

## Contenido de la ventana

1. Datos de la cita (solo lectura): mascota, propietario y telefono,
   veterinario que atiende (el asignado a la cita), fecha y motivo.
2. Anotacion de la atencion: descripcion, diagnostico y observaciones. Los tres
   campos son obligatorios.
3. Formula (opcional): indicaciones generales y una tabla de medicamentos
   (medicamento del inventario, dosis, frecuencia, duracion, cantidad y via).
   El boton "Agregar medicamento" aniade filas y cada fila tiene un boton para
   quitarla. Si no se agrega ningun medicamento, solo se registra la anotacion.

La ventana usa la identidad visual de la marca (aguamarina #4bbdb2 y petroleo
#123b3a): cabecera de datos de la cita en dos columnas con barra de acento,
secciones con titulo, campos con etiqueta y los medicamentos en formato de
tabla. El ancho es mayor para evitar el desplazamiento vertical excesivo.

El catalogo de medicamentos se carga del modulo de inventario al abrir la
pantalla de calendario.

## Al guardar

Se envia una sola peticion a `POST /calendario/atender-cita`. El backend, de
forma transaccional, registra la anotacion, crea la formula si hay medicamentos
y marca la cita como ATENDIDA. Tras el exito se recargan las citas del
calendario. La formula creada queda disponible como pendiente en el modulo de
despacho; la dispensacion la realiza el rol de despacho.

## Validaciones en el frontend

- Descripcion, diagnostico y observaciones obligatorios.
- Toda fila de medicamento seleccionada debe tener dosis; las filas sin
  medicamento se ignoran.
- Los textos que se muestran en la ventana se escapan antes de insertarse en el
  HTML, para evitar que un dato con caracteres especiales rompa la vista.

## Quien lo usa

El flujo lo usan el Medico y el Administrador, que son quienes ven y atienden las
citas del calendario.

## Verificacion

- Construccion del frontend correcta:
  `npx ng build --configuration development`.
- Prueba funcional recomendada (requiere el backend y la base en ejecucion):
  atender una cita, registrar la anotacion y uno o varios medicamentos, y
  comprobar que la cita queda ATENDIDA, la anotacion aparece en la historia y la
  formula figura como pendiente en el modulo de despacho.

## Archivos modificados

- `src/app/demo/pages/calendario/calendario.component.ts`
- `src/app/demo/pages/calendario/service/calendario.service.ts`
- `docs/atencion-cita-calendario.md` (este documento)
