## Why

Los modelos `Expense` y `Category` existen en `prisma/schema.prisma` desde el
`init`, pero **no tienen módulo, endpoints ni páginas**. El proyecto (§12
"Gestión de gastos" y §27 "MVP") pide registrar gastos, administrar categorías,
consultar por rango/categoría/responsable y ver totales. Hoy el sidebar apunta a
`/expenses` y `/expenses/categories`, y ambos devuelven 404.

## What Changes

- **CRUD de categorías** (`GET/POST/PATCH /expenses/categories`) sobre `Category`.
- **CRUD de gastos** (`GET/POST/PATCH /expenses`) sobre `Expense`, con
  `categoryId`, `amount`, `date`, `description` y `receiptUrl`.
- **Filtros y totales**: por categoría, rango de fechas, responsable y texto;
  totales del período, del día y por categoría.
- **Páginas** `/expenses` (listado + filtros + totales + alta/edición) y
  `/expenses/categories` (catálogo de categorías).
- **RBAC**: `ADMIN` y `PERSONAL_ADMINISTRATIVO` (coherente con §12.5 y §14.3).

Fuera de alcance de esta ronda: Reportes PDF de gastos. No requiere migración
(las tablas ya existen).

## Impact

- **Specs**: capability nueva `expenses`.
- **Backend**: `backend/src/expenses/` y registro en `app.module.ts`.
- **Frontend**: `app/(dashboard)/expenses/`, `components/forms/expense-form.tsx`,
  `category-form.tsx`, `lib/api/expenses.ts`, `types/expense.ts`.
- **Sin cambios de base de datos.**
