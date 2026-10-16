## 1. Backend

- [x] 1.1 Crear `backend/src/expenses/expenses.module.ts` y registrarlo en `app.module.ts`.
- [x] 1.2 DTOs: `create-category`, `update-category`, `create-expense`,
      `update-expense`, `query-expenses`, `query-categories`.
- [x] 1.3 `ExpensesService`: categorías (listado con/sin inactivas, alta con
      nombre único, edición, activar/desactivar) y gastos (listado con filtros,
      detalle, alta tomando `createdById` del usuario autenticado, edición).
- [x] 1.4 Totales: `GET /expenses/totals` (total del período, total del día y
      desglose por categoría).
- [x] 1.5 `ExpensesController` con `JwtAuthGuard` + `RolesGuard`
      (`ADMIN`, `PERSONAL_ADMINISTRATIVO`).
- [x] 1.6 Serializar `Decimal` a número.

## 2. Frontend

- [x] 2.1 `types/expense.ts` (`Expense`, `ExpenseInput`, `ExpenseCategory`,
      `ExpenseCategoryInput`, `ExpenseTotals`).
- [x] 2.2 `lib/api/expenses.ts`.
- [x] 2.3 `components/forms/expense-form.tsx` y `category-form.tsx`.
- [x] 2.4 `app/(dashboard)/expenses/page.tsx` (filtros, totales, tabla, acciones).
- [x] 2.5 `app/(dashboard)/expenses/categories/page.tsx`.

## 3. Verificación

- [x] 3.1 `backend`: `npm run build`, `npm run lint`, `npm test`.
- [x] 3.2 `fronted`: `npm run lint`, `npm run build`.
- [x] 3.3 `openspec validate --changes --strict`.
