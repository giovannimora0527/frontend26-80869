# Pantallas nuevas del segundo parcial

Las rutas cuelgan de `/inicio` y los menús llegan desde la base de datos según el perfil (tabla `menu` / `perfil_menu`).

| Ruta | Componente | Qué hace |
|---|---|---|
| `/inicio/inventario` | `InventarioComponent` | Productos, lotes y kárdex, alertas, **carga masiva** con vista previa e informe de errores, historial de cargas |
| `/inicio/servicios` | `ServicioComponent` | Catálogo, tarifas con motivo e historial, activar/inactivar |
| `/inicio/formulas` | `FormulaDetalleComponent` | Fórmula con varios medicamentos (vía, cantidad), detalle y PDF |
| `/inicio/facturacion` | `FacturacionComponent` | Prefactura calculada por el backend, pagos parciales, anulación, PDF |
| `/inicio/despacho` | `DespachoComponent` | Entrega de fórmulas (solo lectura de dosis), parcial/pendiente/cancelado, comprobante |
| `/inicio/reportes` | `ReporteComponent` | 10 reportes, filtros, tabla con encabezados, Excel y PDF |
| `/inicio/agenda` | `AgendaComponent` | Calendario mensual, estados, reprogramar, informe del veterinario, refresco automático |

Servicios HTTP: `services/api.service.ts` (token JWT, descargas de archivos y subida multipart). Modelos: `models/clinica-extra.ts`.
La pantalla anterior de fórmulas (`formula-medica`) queda en el repositorio pero ya no se enruta.

## Comandos
```
npm install
ng serve            # desarrollo, http://localhost:4200
ng build            # compilación
docker build -t clinica-front .   # imagen (solo frontend)
```
El backend se configura en `src/environments/environment.ts` (`apiUrlAuth`).
