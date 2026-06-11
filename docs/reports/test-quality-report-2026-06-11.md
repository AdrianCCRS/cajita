# Reporte de calidad de tests - 2026-06-11

## Resumen

Se revisaron y mejoraron los tests que tenian cobertura debil o ruido en consola.

Resultado final:

```text
bun run test

Test Files  10 passed (10)
Tests       125 passed (125)
Duration    6.01s
```

## Mejoras aplicadas

- `initializeUserBusiness.test.ts`: se reemplazo el test que solo hacia `expect(true).toBe(true)` por una prueba real que ejecuta `initializeUserBusiness`, simula Firestore y verifica que `ownerSalaryTarget: 0` se escriba en `financialSettings/main`.
- `createTransaction.test.ts`: se agregaron casos exitosos para ventas, gastos y retiros. Ahora se valida que Firestore reciba la ruta correcta y que las transacciones guarden snapshots historicos (`serviceName`, `priceAtTime`, `costAtTime`, `categoryName`).
- `formatCurrency.test.ts`: se fortalecio la prueba para comparar contra `Intl.NumberFormat("es-CO")`, incluyendo cero, negativos y redondeo de decimales.
- `src/test/setup.ts`: se ajusto el mock global de HeroUI para no enviar props propias de HeroUI al DOM de prueba. Esto elimino warnings de React como `isOpen`, `isInvalid`, `isRequired`, `isPending`, `isDisabled` y `onPress`.

## Resultado de ejecucion

La suite completa pasa sin errores.

Archivos de test ejecutados:

- `src/shared/lib/firestorePaths.test.ts`
- `src/shared/utils/formatCurrency.test.ts`
- `src/features/transactions/services/createTransaction.test.ts`
- `src/shared/validation/schemas.test.ts`
- `src/features/onboarding/services/initializeUserBusiness.test.ts`
- `src/shared/components/ui.test.tsx`
- `src/shared/data/SpaDataContext.test.tsx`
- `src/shared/utils/dates.test.ts`
- `src/shared/utils/financials.test.ts`
- `src/app/App.test.tsx`

## Observaciones

La cobertura es mas confiable para las reglas criticas del MVP:

- Los retiros siguen separados de los gastos del negocio.
- Las ventas guardan snapshots historicos del servicio.
- Los gastos guardan snapshots historicos de categoria.
- El onboarding acepta salario objetivo en cero y lo persiste correctamente.
- El output de tests queda mas limpio al eliminar ruido del mock de HeroUI.

