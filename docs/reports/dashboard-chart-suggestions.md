# Sugerencias de graficas para dashboard

Este reporte lista graficas posibles usando solo los datos disponibles hoy en Spa Control: servicios, transacciones, gastos fijos, categorias y configuracion financiera.

> Nota importante: los retiros son el salario de la duena. No deben sumarse a los gastos del negocio.

| Grafica | Tipo recomendado | Datos usados | Para que sirve | Prioridad |
|---|---|---|---|---|
| Ventas vs gastos por semana | `bar` | Transacciones `income` y `expense` del mes actual | Ver rapidamente si las ventas superan los gastos del negocio cada semana | Implementada |
| Avance de meta minima | `radialBar` o barra de progreso | Ingreso mensual y meta minima para no perder plata | Saber si el mes ya cubrio los compromisos basicos | Alta |
| Salario pagado vs meta | `radialBar` o barra horizontal | Retiros del mes y salario objetivo | Ver cuanto falta para pagarse su meta mensual | Alta |
| Gastos por categoria | `donut` si hay pocas categorias; `bar horizontal` si hay muchas | Transacciones `expense` agrupadas por `categoryName` | Identificar en que se esta yendo mas dinero | Media |
| Top servicios por ventas | `bar horizontal` | Transacciones `income` agrupadas por `serviceName` y conteo | Entender que servicios se venden mas seguido | Media |
| Top servicios por dinero | `bar horizontal` | Transacciones `income` agrupadas por `serviceName` y total vendido | Entender que servicios traen mas dinero al spa | Media |
| Tendencia diaria de ventas | `line` o `area` | Ventas por dia del mes | Detectar dias fuertes y flojos cuando haya suficientes movimientos | Media |
| Composicion del dinero del mes | `stacked bar` | Ventas, gastos y retiros del mes | Comparar dinero del negocio, salario y ganancia sin mezclarlos | Baja |

## Criterios mobile-first

- Evitar scroll horizontal.
- Preferir 4 a 6 puntos visibles por grafica en celular.
- Usar etiquetas cortas como `Sem 1`, `Sem 2` o nombres resumidos.
- Mostrar empty states cuando no haya datos suficientes.
- No usar graficas que requieran explicar jerga contable para ser utiles.

