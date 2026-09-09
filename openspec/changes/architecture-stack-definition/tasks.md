# Tasks: Architecture Stack Definition

## Fase 1: Configuración Base del Proyecto

### Backend

- [ ] 1.1 Inicializar proyecto NestJS con TypeScript
  ```bash
  npm i -g @nestjs/cli
  nest new backend
  ```
- [ ] 1.2 Configurar Prisma ORM
  ```bash
  npm install prisma @prisma/client
  npx prisma init
  ```
- [ ] 1.3 Definir schema.prisma con modelos iniciales (User, Role, Child, Enrollment, Payment, Attendance, Activity, Report, Specialist, Staff, Expense)
- [ ] 1.4 Configurar variables de entorno (.env.local, .env.produccion)
- [ ] 1.5 Crear módulo Prisma (prisma.service.ts, prisma.module.ts)
- [ ] 1.6 Ejecutar primera migración
  ```bash
  npx prisma migrate dev
  ```

### Frontend

- [ ] 1.7 Inicializar proyecto Next.js 14+ con App Router y TypeScript
  ```bash
  npx create-next-app@latest fronted --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
  ```
- [ ] 1.8 Configurar PWA con next-pwa
  ```bash
  npm install next-pwa
  ```
- [ ] 1.9 Configurar Tailwind CSS con tema personalizado
- [ ] 1.10 Configurar variables de entorno frontend (.env.local, .env.produccion)

---

## Fase 2: Backend - Autenticación y Usuarios

### Auth Module

- [ ] 2.1 Crear módulo Auth (auth.module.ts)
- [ ] 2.2 Implementar DTOs (login.dto.ts, register.dto.ts)
- [ ] 2.3 Implementar AuthService:
  - register() - Hash password, crear usuario
  - login() - Validar credenciales, generar tokens
  - refresh() - Validar refresh token, generar nuevo access token
  - logout() - Invalidar refresh token
- [ ] 2.4 Implementar AuthController:
  - POST /auth/register
  - POST /auth/login
  - POST /auth/refresh
  - GET /auth/me
  - POST /auth/logout
- [ ] 2.5 Implementar JWT Strategy (jwt.strategy.ts)
- [ ] 2.6 Implementar JwtAuthGuard
- [ ] 2.7 Configurar JWT_SECRET y JWT_EXPIRATION en .env

### Users Module

- [ ] 2.8 Crear módulo Users (users.module.ts)
- [ ] 2.9 Implementar UsersService:
  - findAll(), findOne(), findByEmail()
  - create(), update(), remove()
- [ ] 2.10 Implementar UsersController:
  - GET /users
  - GET /users/:id
  - POST /users
  - PATCH /users/:id
  - DELETE /users/:id
- [ ] 2.11 Seed initial admin user

### Roles & Permissions

- [ ] 2.12 Implementar RolesGuard
- [ ] 2.13 Implementar @Roles() decorator
- [ ] 2.14 Aplicar roles a endpoints según spec
- [ ] 2.15 Test de控制 de acceso por rol

---

## Fase 3: Frontend - Auth y Layout

### Auth Pages

- [ ] 3.1 Configurar Axios con interceptores JWT (lib/axios.ts)
- [ ] 3.2 Crear servicios de auth (lib/auth.ts):
  - login(), register(), logout(), refreshToken(), getCurrentUser()
- [ ] 3.3 Implementar Zustand auth store (stores/auth-store.ts)
- [ ] 3.4 Crear página de Login (app/(auth)/login/page.tsx)
- [ ] 3.5 Crear página de Register (app/(auth)/register/page.tsx)
- [ ] 3.6 Implementar ProtectedRoute component
- [ ] 3.7 Implementar RoleBasedRoute component

### Layout

- [ ] 3.8 Instalar shadcn/ui
  ```bash
  npx shadcn-ui@latest init
  ```
- [ ] 3.9 Instalar componentes base de shadcn/ui
- [ ] 3.10 Crear Sidebar component (components/layout/sidebar.tsx)
- [ ] 3.11 Crear Header component (components/layout/header.tsx)
- [ ] 3.12 Crear MobileNav component (components/layout/mobile-nav.tsx)
- [ ] 3.13 Crear Dashboard layout (app/(dashboard)/layout.tsx)
- [ ] 3.14 Crear Root layout con providers (app/layout.tsx)

---

## Fase 4: Módulos Core Backend

### Children Module

- [ ] 4.1 Crear módulo Children (children.module.ts)
- [ ] 4.2 Implementar ChildrenService:
  - findAll(), findOne(), findByParent()
  - create(), update(), remove()
  - search(), filterByStatus()
- [ ] 4.3 Implementar ChildrenController:
  - GET /children
  - GET /children/:id
  - POST /children
  - PATCH /children/:id
  - DELETE /children/:id
- [ ] 4.4 Implementar DTOs y validación

### Enrollments Module

- [ ] 4.5 Crear módulo Enrollments
- [ ] 4.6 Implementar EnrollmentsService:
  - findAll(), findOne(), findByChild()
  - create(), updateStatus()
- [ ] 4.7 Implementar EnrollmentsController
- [ ] 4.8 Implementar DTOs (CreateEnrollmentDto, UpdateEnrollmentDto)

### Payments Module

- [ ] 4.9 Crear módulo Payments
- [ ] 4.10 Implementar PaymentsService:
  - findAll(), findOne(), findByChild()
  - create(), findByPeriod()
  - getPendingPayments(), getPaymentHistory()
- [ ] 4.11 Implementar PaymentsController
- [ ] 4.12 Implementar DTOs y validación

---

## Fase 5: Frontend - Módulos Core

### Children Pages

- [ ] 5.1 Crear página de lista de niños (children/page.tsx)
- [ ] 5.2 Crear componente DataTable para niños
- [ ] 5.3 Crear página de registro de niño (children/new/page.tsx)
- [ ] 5.4 Crear formulario de niño (components/forms/child-form.tsx)
- [ ] 5.5 Crear página de detalle/expediente (children/[id]/page.tsx)
- [ ] 5.6 Implementar búsqueda y filtros

### Enrollments Pages

- [ ] 5.7 Crear página de inscripciones (enrollments/page.tsx)
- [ ] 5.8 Crear formulario de inscripción
- [ ] 5.9 Crear página de detalle de inscripción
- [ ] 5.10 Implementar cambio de estado (Activo/Inactivo/Retirado)

### Payments Pages

- [ ] 5.11 Crear página de pagos (payments/page.tsx)
- [ ] 5.12 Crear formulario de pago
- [ ] 5.13 Crear vista de pagos pendientes
- [ ] 5.14 Implementar historial de pagos por niño

---

## Fase 6: Módulos Operativos Backend

### Attendance Module

- [ ] 6.1 Crear módulo Attendance
- [ ] 6.2 Implementar AttendanceService:
  - register(), findByDate(), findByChild()
  - getDailyReport(), getMonthlyReport()
- [ ] 6.3 Implementar AttendanceController
- [ ] 6.4 Implementar estados (Presente, Ausente, Justificado)

### Activities Module

- [ ] 6.5 Crear módulo Activities
- [ ] 6.6 Implementar ActivitiesService:
  - create(), findByDate(), findByChild()
  - getHistory()
- [ ] 6.7 Implementar ActivitiesController

### Reports Module

- [ ] 6.8 Crear módulo Reports
- [ ] 6.9 Implementar ReportsService:
  - create(), findByChild(), findBySpecialist()
  - generatePdf()
- [ ] 6.10 Implementar ReportsController
- [ ] 6.11 Implementar generación de PDF (pdfkit o similar)

---

## Fase 7: Frontend - Módulos Operativos

### Attendance Pages

- [ ] 7.1 Crear página de asistencias (attendance/page.tsx)
- [ ] 7.2 Crear formulario de registro diario
- [ ] 7.3 Crear vista de historial de asistencia
- [ ] 7.4 Implementar reportes de asistencia

### Activities Pages

- [ ] 7.5 Crear página de actividades (activities/page.tsx)
- [ ] 7.6 Crear formulario de actividad
- [ ] 7.7 Crear vista de historial de actividades

### Reports Pages

- [ ] 7.8 Crear página de informes (reports/page.tsx)
- [ ] 7.9 Crear formulario de informe
- [ ] 7.10 Crear vista de detalle de informe
- [ ] 7.11 Implementar descarga de PDF

---

## Fase 8: Módulos Administrativos Backend

### Specialists Module

- [ ] 8.1 Crear módulo Specialists
- [ ] 8.2 Implementar SpecialistsService:
  - findAll(), findOne(), create(), update()
  - assignToChild(), findByChild()
- [ ] 8.3 Implementar SpecialistsController

### Staff Module

- [ ] 8.4 Crear módulo Staff
- [ ] 8.5 Implementar StaffService:
  - findAll(), findOne(), create(), update()
  - findByCargo(), findByEspecialidad()
- [ ] 8.6 Implementar StaffController

### Expenses Module

- [ ] 8.7 Crear módulo Expenses
- [ ] 8.8 Implementar ExpensesService:
  - create(), findAll(), findByPeriod()
  - findByCategory(), getReport()
- [ ] 8.9 Implementar ExpensesController
- [ ] 8.10 Crear módulo Categories (CRUD de categorías de gastos)

---

## Fase 9: Frontend - Módulos Administrativos

### Specialists Pages

- [ ] 9.1 Crear página de especialistas
- [ ] 9.2 Crear formulario de especialista
- [ ] 9.3 Implementar asignación a niños

### Staff Pages

- [ ] 9.4 Crear página de personal
- [ ] 9.5 Crear formulario de personal
- [ ] 9.6 Implementar gestión de cargos y especialidades

### Expenses Pages

- [ ] 9.7 Crear página de gastos
- [ ] 9.8 Crear formulario de gasto
- [ ] 9.9 Crear página de categorías
- [ ] 9.10 Implementar filtros y reportes de gastos

---

## Fase 10: WebSocket

### Backend

- [ ] 10.1 Crear EventsGateway (events.gateway.ts)
- [ ] 10.2 Implementar autenticación JWT en WebSocket
- [ ] 10.3 Implementar sistema de rooms por rol
- [ ] 10.4 Integrar con módulos (emitir eventos en attendance, activities, reports, payments)

### Frontend

- [ ] 10.5 Configurar Socket.io client (lib/socket.ts)
- [ ] 10.6 Crear useSocket hook
- [ ] 10.7 Implementar sistema de toast notifications
- [ ] 10.8 Crear componente NotificationBell
- [ ] 10.9 Integrar notificaciones en dashboard

---

## Fase 11: Landing Page

- [ ] 11.1 Crear layout público (app/(public)/layout.tsx)
- [ ] 11.2 Crear página de inicio con hero section
- [ ] 11.3 Crear página Sobre Nosotros
- [ ] 11.4 Crear página de Servicios
- [ ] 11.5 Crear página de Contacto con formulario
- [ ] 11.6 Crear sección de FAQ
- [ ] 11.7 Implementar diseño responsive
- [ ] 11.8 Agregar llamadas a la acción

---

## Fase 12: Dashboard y Reportes

### Dashboards

- [ ] 12.1 Crear Dashboard Admin con indicadores:
  - Total niños, niños activos
  - Inscripciones recientes
  - Pagos pendientes
  - Asistencia del día
  - Personal activo
  - Gastos del mes
- [ ] 12.2 Crear Dashboard Especialista:
  - Niños asignados
  - Actividades recientes
  - Informes pendientes

### Reportes

- [ ] 12.3 Implementar reportes de niños (inscritos, activos, retirados)
- [ ] 12.4 Implementar reportes de pagos (por periodo, pendientes)
- [ ] 12.5 Implementar reportes de asistencia (diaria, por niño)
- [ ] 12.6 Implementar reportes de gastos (por categoría, periodo)
- [ ] 12.7 Implementar exportación de reportes (PDF/CSV)

---

## Fase 13: Pulido y Producción

### Seguridad

- [ ] 13.1 Revisar y asegurar todos los endpoints
- [ ] 13.2 Implementar rate limiting
- [ ] 13.3 Implementar logging de auditoría
- [ ] 13.4 Validar que la información de niños no esté expuesta públicamente

### Testing

- [ ] 13.5 Escribir tests unitarios para servicios críticos
- [ ] 13.6 Escribir tests e2e para flujos principales
- [ ] 13.7 Test de autenticación y roles

### Performance

- [ ] 13.8 Optimizar queries de base de datos
- [ ] 13.9 Implementar lazy loading en frontend
- [ ] 13.10 Optimizar bundle size

### Deploy

- [ ] 13.11 Configurar variables de entorno para producción
- [ ] 13.12 Configurar CORS para producción
- [ ] 13.13 Documentar proceso de deploy
- [ ] 13.14 Crear scripts de deploy

---

## Notas

- Cada fase puede dividirse en subtareas más pequeñas según sea necesario
- Los tests deben escribirse junto con la implementación
- La documentación de endpoints se generará automáticamente con Swagger en el backend
- El diseño responsive debe probarse en desktop, tablet y móvil
