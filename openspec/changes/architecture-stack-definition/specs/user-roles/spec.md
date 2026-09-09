# User Roles Specification

## Overview

Sistema de roles y permisos para control de acceso basado en roles (RBAC) en la plataforma Sistema_PsicoTea.

## Requirements

### REQ-ROLES-001: Role Definitions

El sistema soporta los siguientes roles:

| Rol | Descripción | Nivel |
|-----|-------------|-------|
| `ADMIN` | Administrador con acceso completo | Máximo |
| `ESPECIALISTA` | Profesional que trabaja con niños | Medio |
| `PERSONAL_ADMINISTRATIVO` | Staff administrativo | Medio-Bajo |

### REQ-ROLES-002: Admin Permissions

El rol `ADMIN` tiene acceso completo a todos los módulos:

- **Usuarios**: CRUD completo, asignación de roles
- **Niños**: CRUD completo, ver todos los expedientes
- **Inscripciones**: CRUD completo, cambiar estados
- **Pagos**: CRUD completo, ver historial, reportes
- **Asistencias**: CRUD completo, ver reportes
- **Actividades**: CRUD completo, ver historial
- **Informes**: CRUD completo, ver todos los informes
- **Especialistas**: CRUD completo, asignar a niños
- **Personal**: CRUD completo, gestión de RRHH
- **Gastos**: CRUD completo, gestionar categorías, reportes
- **Configuración**: Acceso a settings del sistema
- **Reportes**: Ver todos los reportes administrativos

### REQ-ROLES-003: Especialista Permissions

El rol `ESPECIALISTA` tiene acceso limitado a módulos operativos:

- **Niños**: Solo niños asignados (lectura)
- **Actividades**: CRUD para niños asignados
- **Asistencias**: Registro y consulta para niños asignados
- **Informes**: CRUD de informes de avance para niños asignados
- **Observaciones**: Crear y ver observaciones

**Sin acceso a**:
- Pagos
- Gastos
- Gestión de usuarios
- Configuración del sistema
- Reportes administrativos (salvo permiso explícito)

### REQ-ROLES-004: Personal Administrativo Permissions

El rol `PERSONAL_ADMINISTRATIVO` tiene acceso a módulos administrativos operativos:

- **Niños**: CRUD completo
- **Inscripciones**: CRUD completo
- **Pagos**: CRUD completo
- **Asistencias**: CRUD completo
- **Actividades**: CRUD completo
- **Personal**: Consulta (no edición de RRHH)
- **Gastos**: Registro y consulta (con autorización)

**Sin acceso a**:
- Gestión de usuarios
- Configuración del sistema
- Informes de avance (salvo permiso explícito)

### REQ-ROLES-005: Role Assignment

- Solo el Admin puede asignar roles a usuarios
- Un usuario tiene un solo rol activo
- El rol se almacena en la tabla `users` como enum
- Cambio de rol requiere permiso de Admin

### REQ-ROLES-006: Roles Decorator

```typescript
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('users')
findAll() { ... }
```

- Decorador `@Roles()` acepta múltiples roles
- RolesGuard verifica el rol del usuario contra los roles permitidos
- Si el usuario no tiene el rol requerido, retorna 403 Forbidden

### REQ-ROLES-007: Role-Based UI

El frontend debe:
- Ocultar/mostrar elementos del menú según el rol
- Bloquear acceso a rutas no autorizadas
- Mostrar/ocultar botones de acción según permisos
- Redirigir a dashboard correspondiente al rol al hacer login

### REQ-ROLES-008: Future Extensibility

- El sistema debe permitir agregar nuevos roles sin modificar código existente
- Los permisos deben poder configurarse por módulo
-考虑ación para futuros roles: TUTOR (padre de familia), SUPERVISOR

## Permission Matrix

| Módulo | ADMIN | ESPECIALISTA | PERSONAL_ADMINISTRATIVO |
|--------|-------|--------------|------------------------|
| Usuarios | CRUD | - | - |
| Niños | CRUD | Read (asignados) | CRUD |
| Inscripciones | CRUD | - | CRUD |
| Pagos | CRUD | - | CRUD |
| Asistencias | CRUD | CRUD (asignados) | CRUD |
| Actividades | CRUD | CRUD (asignados) | CRUD |
| Informes | CRUD | CRUD (asignados) | - |
| Especialistas | CRUD | - | Read |
| Personal | CRUD | - | Read |
| Gastos | CRUD | - | CRUD (autorizado) |
| Categorías | CRUD | - | - |
| Reportes | All | Propios | Autorizados |
| Configuración | CRUD | - | - |

## Endpoints Summary

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | /users | ADMIN | List all users |
| PATCH | /users/:id/role | ADMIN | Change user role |
| GET | /children | ADMIN, PERSONAL | List all children |
| GET | /children/assigned | ESPECIALISTA | List assigned children |
| POST | /reports | ESPECIALISTA | Create progress report |
| GET | /reports | ADMIN | All reports |
| GET | /reports/mine | ESPECIALISTA | Own reports |
