# Project Structure Specification

## Purpose

Estructura de carpetas y organización del código para el proyecto Sistema_PsicoTea, separado en frontend (Next.js) y backend (NestJS). Define monorepo, organización de módulos backend, App Router del frontend, componentes, utilidades, convenciones de código, variables de entorno y estructura de testing.

## Requirements

### Requirement: Monorepo Structure

El proyecto SHALL organizarse como monorepo con dos paquetes principales: backend (NestJS) y fronted (Next.js PWA).

```
Sistema_PsicoTea/
├── backend/          # NestJS API REST
├── fronted/          # Next.js PWA (nota: directorio "fronted" según proyecto existente)
└── openspec/         # Documentación y specs
```

#### Scenario: Estructura raíz
- **WHEN** se inspecciona la raíz del repositorio
- **THEN** existen los directorios `backend/`, `fronted/` y `openspec/`

### Requirement: Backend Module Organization

Cada dominio del negocio SHALL organizarse como un módulo NestJS independiente bajo `backend/src/`.

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

#### Scenario: Módulos de dominio
- **WHEN** se inspecciona `backend/src/`
- **THEN** cada dominio (auth, users, children, enrollments, payments, attendance, activities, reports, specialists, staff, expenses, websocket) tiene su propio módulo, junto con `common/`, `prisma/`, `app.module.ts` y `main.ts`

### Requirement: Module Structure

Cada módulo NestJS SHALL seguir la estructura estándar con module, controller, service, dto, entities e interfaces.

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

#### Scenario: Estructura de módulo
- **WHEN** se inspecciona un módulo NestJS del backend
- **THEN** contiene `*.module.ts`, `*.controller.ts`, `*.service.ts`, y directorios `dto/`, `entities/` (si aplica) e `interfaces/`

### Requirement: Frontend App Router Structure

El frontend SHALL usar Next.js App Router con route groups (`(auth)`, `(dashboard)`, `(public)`).

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

#### Scenario: Route groups
- **WHEN** se inspecciona `fronted/src/app/`
- **THEN** existen los route groups `(auth)`, `(dashboard)` y `(public)` con sus rutas, además del root `layout.tsx` y `page.tsx`

### Requirement: Components Organization

Los componentes del frontend SHALL organizarse en `ui/`, `forms/`, `layout/` y `shared/` bajo `fronted/src/components/`.

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

#### Scenario: Carpetas de componentes
- **WHEN** se inspecciona `fronted/src/components/`
- **THEN** existen las carpetas `ui/`, `forms/`, `layout/` y `shared/`

### Requirement: Lib Utilities

Las utilidades del frontend SHALL organizarse en `fronted/src/lib/` con instancias de axios, auth, socket y utils.

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

#### Scenario: Utilidades centralizadas
- **WHEN** se inspecciona `fronted/src/lib/`
- **THEN** existen `axios.ts`, `auth.ts`, `socket.ts` y `utils.ts` con las funciones indicadas

### Requirement: Shared Code Patterns

El código SHALL seguir convenciones de nombres (`kebab-case`, `PascalCase`, `camelCase`, `UPPER_SNAKE_CASE`, DTOs con sufijo `Dto`) y un orden de imports consistente.

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

#### Scenario: Convenciones aplicadas
- **WHEN** se revisa código nuevo en el repositorio
- **THEN** respeta las convenciones de nombres y el orden de imports definidos

### Requirement: Environment Files

Las variables de entorno SHALL configurarse mediante archivos `.env` separados por entorno, con un template `.env.example` sin valores sensibles.

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

#### Scenario: Archivos por entorno
- **WHEN** se inspeccionan `backend/` y `fronted/`
- **THEN** existen archivos `.env` por entorno y un `.env.example` sin valores sensibles

### Requirement: Testing Structure

Los tests SHALL organizarse con e2e specs en `backend/test/`, unit specs junto a cada módulo en `backend/src/`, y tests del frontend en `fronted/__tests__/`.

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

#### Scenario: Ubicación de tests
- **WHEN** se inspecciona el repositorio
- **THEN** los tests e2e están en `backend/test/`, los unit tests junto a su módulo en `backend/src/`, y los tests del frontend en `fronted/__tests__/`

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