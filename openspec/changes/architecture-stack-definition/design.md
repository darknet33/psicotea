# Design: Architecture Stack Definition

## Stack Tecnológico

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| Frontend | Next.js (App Router) | 14+ | SSR/SSG, TypeScript nativo, routing basado en archivos |
| PWA | next-pwa | latest | Offline, instalable, experiencia nativa |
| Backend | NestJS | 10+ | Modular, TypeScript, arquitectura escalable |
| ORM | Prisma | latest | Type-safe, migraciones automáticas, MySQL |
| Base de datos | MySQL | 8.0+ | Relacional, confiable, amplio soporte |
| Autenticación | JWT (jsonwebtoken) | - | Estándar, stateless, escalable |
| HTTP Client | Axios | latest | Interceptors para JWT, manejo de errores |
| WebSocket | Socket.io (NestJS Gateway) | - | Notificaciones tiempo real, fallback polling |
| UI Components | shadcn/ui | latest | Accesible, personalizable, copy-paste |
| CSS | Tailwind CSS | latest | Utility-first, responsive, personalizable |
| Animaciones | Framer Motion | latest | Transiciones suaves, performante |
| Estado | Zustand | latest | Ligero, simple, TypeScript-friendly |
| Validación Backend | class-validator | - | Decoradores, integración NestJS |
| Validación Frontend | zod | latest | Type-safe, esquemas reutilizables |
| Iconos | Lucide React | latest | Consistentes, ligeros, SVG |

## Estructura de Carpetas

### Backend (NestJS)

```
backend/
├── src/
│   ├── auth/                   # Módulo de autenticación
│   │   ├── auth.controller.ts  # Endpoints: login, register, refresh
│   │   ├── auth.service.ts     # Lógica de auth, hashing, tokens
│   │   ├── auth.module.ts      # Configuración del módulo
│   │   ├── jwt.strategy.ts     # Estrategia JWT Passport
│   │   ├── jwt-auth.guard.ts   # Guard para rutas protegidas
│   │   ├── roles.guard.ts      # Guard para control por roles
│   │   ├── roles.decorator.ts  # Decorador @Roles()
│   │   └── dto/
│   │       ├── login.dto.ts
│   │       └── register.dto.ts
│   ├── users/                  # Gestión de usuarios
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   ├── children/               # Módulo de niños
│   │   ├── children.controller.ts
│   │   ├── children.service.ts
│   │   ├── children.module.ts
│   │   └── dto/
│   ├── enrollments/            # Inscripciones
│   │   ├── enrollments.controller.ts
│   │   ├── enrollments.service.ts
│   │   ├── enrollments.module.ts
│   │   └── dto/
│   ├── payments/               # Pagos
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── payments.module.ts
│   │   └── dto/
│   ├── attendance/             # Asistencias
│   │   ├── attendance.controller.ts
│   │   ├── attendance.service.ts
│   │   ├── attendance.module.ts
│   │   └── dto/
│   ├── activities/             # Actividades diarias
│   │   ├── activities.controller.ts
│   │   ├── activities.service.ts
│   │   ├── activities.module.ts
│   │   └── dto/
│   ├── reports/                # Informes de avance
│   │   ├── reports.controller.ts
│   │   ├── reports.service.ts
│   │   ├── reports.module.ts
│   │   └── dto/
│   ├── specialists/            # Especialistas
│   │   ├── specialists.controller.ts
│   │   ├── specialists.service.ts
│   │   ├── specialists.module.ts
│   │   └── dto/
│   ├── staff/                  # Personal / RRHH
│   │   ├── staff.controller.ts
│   │   ├── staff.service.ts
│   │   ├── staff.module.ts
│   │   └── dto/
│   ├── expenses/               # Gastos
│   │   ├── expenses.controller.ts
│   │   ├── expenses.service.ts
│   │   ├── expenses.module.ts
│   │   └── dto/
│   ├── websocket/              # Gateway WebSocket
│   │   ├── events.gateway.ts
│   │   └── events.module.ts
│   ├── common/                 # Compartido
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── dto/
│   │       └── pagination.dto.ts
│   ├── prisma/                 # Configuración Prisma
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma           # Modelo de datos
│   └── seed.ts                 # Datos iniciales
├── test/
├── .env.local
├── .env.produccion
├── nest-cli.json
├── tsconfig.json
└── package.json
```

### Frontend (Next.js)

```
fronted/
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Rutas de autenticación
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/            # Rutas del dashboard (protegidas)
│   │   │   ├── children/           # Niños
│   │   │   │   ├── page.tsx        # Lista
│   │   │   │   ├── [id]/           # Detalle/Expediente
│   │   │   │   └── new/
│   │   │   ├── enrollments/        # Inscripciones
│   │   │   ├── payments/           # Pagos
│   │   │   ├── attendance/         # Asistencias
│   │   │   ├── activities/         # Actividades
│   │   │   ├── reports/            # Informes
│   │   │   ├── specialists/        # Especialistas
│   │   │   ├── staff/              # Personal
│   │   │   ├── expenses/           # Gastos
│   │   │   ├── settings/           # Configuración
│   │   │   └── layout.tsx          # Layout con sidebar
│   │   ├── (public)/               # Landing Page
│   │   │   ├── about/
│   │   │   ├── services/
│   │   │   ├── contact/
│   │   │   └── page.tsx
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Home (redirect o landing)
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── form.tsx
│   │   │   └── ...
│   │   ├── forms/                  # Formularios reutilizables
│   │   │   ├── child-form.tsx
│   │   │   ├── payment-form.tsx
│   │   │   └── ...
│   │   ├── layout/                 # Componentes de layout
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── mobile-nav.tsx
│   │   │   └── breadcrumb.tsx
│   │   └── shared/                 # Componentes compartidos
│   │       ├── data-table.tsx
│   │       ├── search-input.tsx
│   │       ├── status-badge.tsx
│   │       └── page-header.tsx
│   ├── lib/
│   │   ├── axios.ts                # Configuración Axios + interceptores
│   │   ├── auth.ts                 # Helpers: getToken, setToken, logout
│   │   ├── socket.ts               # Configuración Socket.io client
│   │   └── utils.ts                # Utilidades generales
│   ├── hooks/
│   │   ├── use-auth.ts             # Hook de autenticación
│   │   ├── use-socket.ts           # Hook de WebSocket
│   │   └── use-debounce.ts
│   ├── stores/
│   │   ├── auth-store.ts           # Estado de autenticación
│   │   └── ui-store.ts             # Estado de UI (sidebar, theme)
│   └── types/
│       ├── user.ts
│       ├── child.ts
│       ├── enrollment.ts
│       └── ...
├── public/
│   ├── manifest.json               # PWA manifest
│   ├── icons/
│   │   ├── icon-192x192.png
│   │   └── icon-512x512.png
│   └── images/
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.js
└── package.json
```

## Sistema de Autenticación (JWT)

### Flujo

```
1. Login → POST /auth/login
   Request:  { email, password }
   Response: { access_token, refresh_token, user }

2. Uso normal → GET /api/resource
   Header: Authorization: Bearer <access_token>

3. Token expira → 401 Unauthorized

4. Refresh → POST /auth/refresh
   Header: Authorization: Bearer <refresh_token>
   Response: { access_token }

5. Refresh expira → Redirigir a login
```

### Configuración de Tokens

| Token | Duración | Uso |
|-------|----------|-----|
| Access Token | 15 minutos | Requests normales |
| Refresh Token | 7 días | Renovación de access token |

### Guards

- `JwtAuthGuard`: Verifica token válido en rutas protegidas
- `RolesGuard`: Verifica que el usuario tenga el rol requerido
- Decorador `@Roles('admin', 'especialista')`: Define roles permitidos por endpoint

## Roles y Permisos

### Admin

- Acceso completo a todos los módulos
- Gestionar usuarios, roles y permisos
- Ver todos los reportes y configuraciones
- Gestionar categorías de gastos

### Especialista

- Ver niños asignados
- Registrar actividades y asistencias
- Elaborar informes de avance
- Consultar informes anteriores
- Sin acceso a pagos, gastos, RRHH (salvo permiso explícito)

### Personal Administrativo

- Registrar y consultar niños
- Gestionar inscripciones
- Registrar pagos
- Registrar asistencias
- Registrar actividades
- Gestionar gastos (con autorización)
- Consultar reportes autorizados

## Variables de Entorno

### .env.local (Desarrollo)

```env
# Base de datos
DATABASE_URL="mysql://root:password@localhost:3306/psicotea_db"

# JWT
JWT_SECRET="dev-jwt-secret-key-change-in-production"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="dev-refresh-secret-key-change-in-production"
JWT_REFRESH_EXPIRATION="7d"

# API
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WS_URL="http://localhost:3001"

# NestJS
PORT=3001
```

### .env.produccion

```env
# Base de datos
DATABASE_URL="mysql://user:secure_password@prod-host:3306/psicotea_db"

# JWT (valores seguros generados aleatoriamente)
JWT_SECRET="<generar-aleatorio>"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="<generar-aleatorio>"
JWT_REFRESH_EXPIRATION="7d"

# API
NEXT_PUBLIC_API_URL="https://api.psicotea.com"
NEXT_PUBLIC_WS_URL="https://api.psicotea.com"

# NestJS
PORT=3001
NODE_ENV=production
```

## Diseño UI/UX

### Principios

1. **Amigable**: Interfaz cálida y acogedora, apropiada para el contexto de niños
2. **Accesible**: WCAG 2.1 AA, contraste adecuado, navegación por teclado
3. **Responsive**: Mobile-first, funciona en desktop, tablet y móvil
4. **Consistente**: Patrones de interfaz coherentes en todos los módulos
5. **Simple**: Tareas frecuentes con mínimo número de pasos

### Paleta de Colores (Sugerida)

- **Primario**: Azul suave (#6366f1) - Confianza, calma
- **Secundario**: Verde menta (#10b981) - Crecimiento, salud
- **Acento**: Morado suave (#8b5cf6) - Creatividad
- **Neutros**: Grises cálidos para fondos y texto
- **Éxito/Error**: Verde (#22c55e) / Rojo suave (#ef4444)

### Tipografía

- **Inter**: Principal, legible, moderna
- **Tamaños**: Escala consistente (14px base, 16px, 18px, 20px, 24px, 30px, 36px)

### Componentes Base (shadcn/ui)

- Button, Input, Select, Checkbox, Radio
- Card, Dialog, Sheet, Tabs
- Table, DataTable (con paginación y filtros)
- Form (con validación)
- Badge, Alert, Toast
- Calendar, DatePicker
- Avatar, Dropdown Menu

### Layout del Dashboard

```
┌─────────────────────────────────────────┐
│  Header (logo, notificaciones, usuario) │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │       Contenido Principal    │
│          │                              │
│ - Kids   │  ┌──────┐ ┌──────┐ ┌──────┐ │
│ - Enroll │  │Card 1│ │Card 2│ │Card 3│ │
│ - Pay    │  └──────┘ └──────┘ └──────┘ │
│ - Attend │                              │
│ - Report │  ┌──────────────────────────┐│
│ - Staff  │  │      Tabla / Lista      ││
│ - Exp    │  │                          ││
│          │  └──────────────────────────┘│
└──────────┴──────────────────────────────┘
```

## WebSocket

### Eventos

| Evento | Dirección | Descripción |
|--------|-----------|-------------|
| `connection` | Client→Server | Cliente conectado |
| `notification` | Server→Client | Notificación en tiempo real |
| `attendance:update` | Server→Client | Actualización de asistencia |
| `activity:new` | Server→Client | Nueva actividad registrada |
| `report:new` | Server→Client | Nuevo informe de avance |

### Implementación

- **Backend**: `EventsGateway` con decoradores `@WebSocketGateway()`
- **Frontend**: Socket.io client configurado en `lib/socket.ts`
- **Hook**: `useSocket()` para manejar eventos en componentes

## Base de Datos (Prisma Schema Preview)

```prisma
model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  password      String
  name          String
  lastName      String
  role          Role      @default(PERSONAL_ADMINISTRATIVO)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Role {
  ADMIN
  ESPECIALISTA
  PERSONAL_ADMINISTRATIVO
}

model Child {
  id              Int          @id @default(autoincrement())
  name            String
  lastName        String
  dateOfBirth     DateTime
  sex             String
  photo           String?
  enrollmentDate  DateTime
  isActive        Boolean      @default(true)
  parentId        Int
  parent          User         @relation(fields: [parentId], references: [id])
  enrollments     Enrollment[]
  attendances     Attendance[]
  activities      Activity[]
  reports         Report[]
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

// ... más modelos en schema.prisma completo
```
