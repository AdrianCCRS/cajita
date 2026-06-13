# Resumen ejecutivo: costos por insumos y presentacion del historial

Fecha: 2026-06-13

## Estado general

La feature quedo en estado funcional y verificado. El sistema ya permite administrar insumos, asociarlos a servicios y usar esa informacion para calcular el costo estimado por servicio. Tambien se mejoro la presentacion del historial para que las ventas se vean agrupadas por servicio dentro del periodo de consulta, evitando una lista larga de tarjetas repetidas.

## Cambios implementados

### Modelo de informacion

- Se agrego soporte para insumos o materias primas del negocio.
- Cada insumo guarda unidad de compra, cantidad comprada, precio, unidad base y costo unitario calculado.
- Los servicios pueden asociar insumos con la pregunta operativa: "para cuantos servicios alcanza este insumo".
- El costo del servicio se calcula con base en el costo proporcional de cada insumo asociado.
- Las ventas siguen guardando snapshots historicos como `serviceName`, `priceAtTime` y `costAtTime`, para que los reportes antiguos no cambien si luego cambia el servicio.

### UI de servicios

- La pantalla de servicios ahora centraliza dos apartados: `Servicios` e `Insumos`.
- Los insumos ya no estan como una opcion separada del menu principal.
- La tabla de servicios tiene acciones separadas:
  - ver insumos asociados;
  - agregar un nuevo insumo al servicio;
  - editar servicio;
  - activar o desactivar servicio.
- El formulario para agregar insumos a un servicio quedo separado de la lista de insumos ya asociados.
- El selector de insumos usa busqueda y muestra un maximo acotado de resultados para no hacer pesada la experiencia con muchos insumos.
- Se corrigieron inputs numericos para evitar valores negativos y, cuando aplica, tambien evitar cero.

### Historial

- Las ventas ya no se muestran como una tarjeta individual por cada venta.
- Ahora se agrupan por servicio segun el periodo y filtros activos.
- Cada grupo de venta muestra:
  - nombre del servicio;
  - cantidad de ventas;
  - total vendido;
  - ganancia real acumulada;
  - fecha de la ultima venta.
- El detalle de una venta agrupada muestra un resumen y no ofrece eliminar, porque representa varias ventas.
- Gastos y pagos a la duena se mantienen como movimientos individuales, para conservar revision y eliminacion puntual.

## Resultado para la usuaria

La pantalla queda mas facil de revisar en celular. La duena puede ver rapidamente cuanto vendio de cada servicio en el periodo consultado y cuanto le dejo realmente, sin navegar entre muchas tarjetas repetidas.

El flujo de servicios tambien queda mas ordenado: una accion sirve para revisar insumos ya asociados y otra accion distinta sirve para agregar un nuevo insumo.

## Verificacion

Comandos ejecutados:

```bash
bun run test
bun run build
```

Resultado:

- Tests: 194/194 pasando.
- Build: exitoso.
- Advertencia pendiente: Vite reporta chunks mayores a 500 kB. No bloquea el build, pero conviene revisar code splitting mas adelante.

## Pendientes sugeridos

- Definir si el detalle de ventas agrupadas debe mostrar tambien el desglose de ventas individuales en una segunda vista.
- Evaluar si los grupos de ventas deben poder exportarse en una fase posterior.
- Revisar optimizacion de bundle para reducir el warning de chunks grandes.
- Agregar una validacion visual en mobile real para confirmar que las tablas y bottom sheets mantienen buena ergonomia a 390 px.
