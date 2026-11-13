# Identidad visual - Clinica DDSF

Documenta la personalizacion estetica aplicada sobre la plantilla Datta Able
(Angular 19 + Bootstrap 5) para dar identidad de marca a la clinica. El nombre
"Clinica DDSF" corresponde a las iniciales del equipo (David, Danna, Sebastian,
Farid).

## Paleta de color

Definida en `src/scss/_variables.scss`:

- Color primario (marca): aguamarina `#4bbdb2`. Se eligio una variante algo mas
  saturada que el pastel puro para garantizar contraste en botones y enlaces.
- Acentos degradados: de `#7fd1c9` a `#4bbdb2`.
- Sidebar y cabecera: verde petroleo oscuro `#123b3a` (en lugar del gris
  original), mas elegante y coherente con el aguamarina.
- Texto de menu: `#c6dedb`; caption de grupos: `#7fd1c9`.
- Fondo general de la aplicacion: `#f3f8f7`.

## Tipografia

Definida en `src/index.html` (Google Fonts) y aplicada en `_variables.scss` y
`_custom.scss`:

- Titulos: `Poppins`.
- Texto general: `Inter`.

Ambas son tipografias profesionales, legibles y gratuitas.

## Marca del sidebar

`src/app/theme/layout/admin/navigation/nav-logo/nav-logo.component.html`:

- Se conserva el logo de mascotas de la plantilla
  (`assets/images/logo_mascotas.png`) dentro de un recuadro blanco redondeado,
  acompanado del nombre "Clinica DDSF".

Si en el futuro se dispone de un archivo de logo propio, basta con sustituir la
imagen apuntando a otro archivo en `src/assets/images/`.

## Pantalla de login

`src/app/demo/pages/login/login.component.scss` y `.html`:

- Se cambio la paleta azul original por la de marca (verde petroleo + aguamarina).
- El logo del formulario (foto del perro, `logo-vet.jpg`) se resalta con un
  anillo aguamarina.
- Botones e inputs con bordes redondeados y el titulo con tipografia Poppins.
- Pie de pagina actualizado a "Clinica DDSF - Veterinaria".
- La imagen de fondo del panel izquierdo es la que el equipo ya coloco en
  `src/assets/images/fondo-login-web.jpg`.

## Organizacion del menu lateral

`src/app/theme/layout/admin/navigation/navigation.ts`:

El menu dejo de ser una lista plana y larga. Ahora se organiza en grupos
("cajitas") con su encabezado:

- Agenda: Citas.
- Mi Clinica: Historias, Formulas, Mascotas, Clientes.
- Inventario y despacho: Inventario, Despacho.
- Gestion: Servicios, Facturacion, Reportes.
- Administracion: Medicos, Especializaciones, Usuarios, Roles.

Cada item conserva su identificador (`id`), que es el codigo con el que el
filtro por `perfil_menu` decide si el item se muestra al rol autenticado. Un
grupo solo aparece si al menos uno de sus items esta permitido para el rol, de
modo que el control de acceso por perfil se mantiene intacto.

## Ajustes de layout

`src/scss/_custom.scss` y el breadcrumb:

- Se elimino la duplicacion del titulo. Antes el encabezado mostraba el titulo
  varias veces ("Pantalla / Home / Pantalla"). Ahora el breadcrumb muestra solo
  la ruta de migas (Inicio / Pantalla) y cada pantalla conserva su propio
  titulo, sin repeticiones.
- Se redujo el espacio superior entre la cabecera y el contenido, que dejaba un
  hueco grande.
- El usuario de la esquina superior derecha se presenta dentro de una cajita
  (pill) con borde redondeado para demarcar la sesion activa. Se ajusto su alto
  y el espacio a la derecha del header para que no se recorte ni se desborde.
- Las tarjetas (`card`) usan bordes redondeados y una sombra suave coherente
  con la marca.

## Archivos modificados

- `src/index.html` (fuentes y titulo del documento).
- `src/scss/_variables.scss` (paleta y tipografia).
- `src/scss/_custom.scss` (marca, menu, layout, usuario, tarjetas).
- `src/app/theme/layout/admin/navigation/nav-logo/nav-logo.component.html` (marca).
- `src/app/theme/layout/admin/navigation/navigation.ts` (agrupacion del menu).
- `src/app/theme/shared/components/breadcrumbs/breadcrumbs.component.html` y `.ts`
  (ruta de migas sin titulo duplicado y titulo del documento).
- `src/app/theme/layout/admin/admin.component.html` (nombre de marca en el home).

La foto de fondo del login ya habia sido reemplazada por el equipo en
`src/assets/images/fondo-login-web.jpg`.

## Pantalla de inicio (bienvenida)

`src/app/theme/layout/admin/admin.component.scss` y `.html`:

- Se alinearon los colores de la pantalla de bienvenida a la paleta de marca
  (petroleo + aguamarina), reemplazando los azules previos.
- Los accesos rapidos (mascotas, historias, usuarios, citas) se rediseñaron como
  tarjetas con icono en recuadro aguamarina, bordes redondeados y una leve
  elevacion al pasar el cursor. Ademas se emparejaron a un tamaño uniforme (dos
  por fila) para una cuadricula simetrica.
- El panel lateral derecho (logo y mensaje de la clinica) usa un degradado
  petroleo con esquinas redondeadas y mayor contraste.
- Los tres destacados inferiores (agenda, gestion, aprendizaje) muestran su
  icono dentro de un recuadro suave de marca.
- Titulos con la tipografia Poppins.
