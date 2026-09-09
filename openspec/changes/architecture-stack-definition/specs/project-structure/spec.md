# Project Structure Specification

## Overview

Estructura de carpetas y organización del código para el proyecto Sistema_PsicoTea, separado en frontend (Next.js) y backend (NestJS).

## Requirements

### REQ-STRUCT-001: Monorepo Structure

El proyecto se organiza como monorepo con dos paquetes principales:

```
Sistema_PsicoTea/
├── backend/          # NestJS API REST
├── fronted/          # Next.js PWA (nota: directorio "fronted" según proyecto existente)
└── openspec/         # Documentación y specs
```

### REQ-STRUCT-002: Backend Module Organization

Cada dominio del negocio se organiza como un módulo NestJS independiente:

```
backend/src/
├── auth/           # Autenticación y autorización
├── users/          # Gestión de usuarios
├── children/       # Gestión de niños
├── enrollments/    # Inscripciones
├── payments/       # Pagos
├── attendance/     # Asistencias
├── activities/     # Actividades diarias
├── reports/        # Informes de avance
├── specialists/    # Especialistas
├── staff/          # Personal / RRHH
├── expenses/       # Gastos
├── websocket/      # Comunicación en tiempo real
├── common/         # Compartido entre módulos
├── prisma/         # Configuración de base de datos
├── app.module.ts   # Root module
└── main.ts         # Bootstrap
```

### REQ-STRUCT-003: Module Structure

Cada módulo sigue la estructura estándar de NestJS:

```
module-name/
├── module-name.module.ts    # Definición del módulo
├── module-name.controller.ts # Endpoints HTTP
├── module-name.service.ts    # Lógica de negocio
├── dto/                      # Data Transfer Objects
│   ├── create-*.dto.ts
│   ├── update-*.dto.ts
│   └── query-*.dto.ts
├── entities/                 # Entidades de dominio (si aplica)
│   └── *.entity.ts
└── interfaces/               # Interfaces TypeScript
    └── *.interface.ts
```

### REQ-STRUCT-004: Frontend App Router Structure

El frontend usa Next.js App Router con route groups:

```
fronted/src/app/
├── (auth)/             # Grupo: autenticación (sin layout privado)
│   ├── login/
│   ├── register/
│   └── layout.tsx
├── (dashboard)/        # Grupo: dashboard (con layout privado)
│   ├── children/
│   ├── enrollments/
│   ├── payments/
│   ├── attendance/
│   ├── activities/
│   ├── reports/
│   ├── specialists/
│   ├── staff/
│   ├── expenses/
│   ├── settings/
│   └── layout.tsx
├── (public)/           # Grupo: landing page (público)
│   ├── about/
│   ├── services/
│   ├── contact/
│   └── page.tsx
├── layout.tsx          # Root layout
└── page.tsx            # Home page
```

### REQ-STRUCT-005: Components Organization

```
fronted/src/components/
├── ui/                 # shadcn/ui components (generados)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── forms/              # Formularios de dominio
│   ├── child-form.tsx
│   ├── payment-form.tsx
│   └── ...
├── layout/             # Componentes de layout
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── mobile-nav.tsx
│   └── breadcrumb.tsx
└── shared/             # Componentes reutilizables
    ├── data-table.tsx
    ├── search-input.tsx
    ├── status-badge.tsx
    └── page-header.tsx
```

### REQ-STRUCT-006: Lib Utilities

```
fronted/src/lib/
├── axios.ts            # Instancia Axios configurada
│   - Base URL desde env
│   - Interceptor request: agrega JWT token
│   - Interceptor response: maneja 401, refresh token
├── auth.ts             # Funciones de auth
│   - getToken()
│   - setToken()
│   - removeToken()
│   - isAuthenticated()
├── socket.ts           # Configuración Socket.io
│   - Conexión al server
│   - Manejo de eventos
└── utils.ts            # Utilidades generales
    - formatDate()
    - formatCurrency()
    - classNames()
```

### REQ-STRUCT-007: Shared Code Patterns

**Naming conventions**:
- Archivos: `kebab-case` (child-form.tsx, auth.service.ts)
- Componentes: `PascalCase` (ChildForm, AuthGuard)
- Funciones/variables: `camelCase` (getUser, isAuthenticated)
- Constantes: `UPPER_SNAKE_CASE` (API_URL, JWT_SECRET)
- DTOs: `PascalCase` con sufijo `Dto` (CreateChildDto)

**Import order**:
1. React/Next.js imports
2. Third-party libraries
3. Internal components
4. Lib/utilities
5. Types
6. Styles

### REQ-STRUCT-008: Environment Files

```
backend/
├── .env.local          # Desarrollo local
├── .env.produccion     # Producción
├── .env.example        # Template (sin valores sensibles)
└── .env.test           # Testing

fronted/
├── .env.local          # Desarrollo local
├── .env.produccion     # Producción
└── .env.example        # Template
```

### REQ-STRUCT-009: Testing Structure

```
backend/
├── test/
│   ├── auth.e2e-spec.ts
│   ├── children.e2e-spec.ts
│   └── ...
├── src/
│   ├── auth/
│   │   └── auth.service.spec.ts
│   └── ...

fronted/
├── __tests__/
│   ├── components/
│   └── lib/
└── ...
```

## File Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Component | PascalCase | ChildForm.tsx |
| Page | page.tsx | page.tsx |
| Layout | layout.tsx | layout.tsx |
| Service | kebab-case | auth.service.ts |
| Controller | kebab-case | auth.controller.ts |
| DTO | PascalCase + Dto | CreateChildDto |
| Entity | PascalCase | User.entity.ts |
| Guard | PascalCase + Guard | JwtAuthGuard |
| Decorator | PascalCase + Decorator | RolesDecorator |
| Hook | camelCase + use | useAuth.ts |
| Store | camelCase + store | authStore.ts |
| Utility | camelCase | formatDate.ts |
| Test | *.spec.ts / *.e2e-spec.ts | auth.service.spec.ts |
