# User Roles Specification

## Purpose

Sistema de roles y permisos para control de acceso basado en roles (RBAC) en la plataforma Sistema_PsicoTea. Define la definición de roles, permisos de ADMIN, ESPECIALISTA y PERSONAL_ADMINISTRATIVO, asignación de roles, decorador `@Roles()`, UI basada en rol y extensibilidad futura.

## Requirements

### Requirement: Role Definitions

El sistema SHALL soportar los roles `ADMIN`, `ESPECIALISTA` y `PERSONAL_ADMINISTRATIVO`.

| Rol | Descripción | Nivel |
|-----|-------------|-------|
| `ADMIN` | Administrador con acceso completo | Máximo |
| `ESPECIALISTA` | Profesional que trabaja con niños | Medio |
| `PERSONAL_ADMINISTRATIVO` | Staff administrativo | Medio-Bajo |

#### Scenario: Roles definidos
- **WHEN** se consulta la lista de roles del sistema
- **THEN** existen `ADMIN`, `ESPECIALISTA` y `PERSONAL_ADMINISTRATIVO` con sus niveles definidos

### Requirement: Admin Permissions

El rol `ADMIN` SHALL tener acceso completo (CRUD) a todos los módulos del sistema.

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

#### Scenario: Acceso de admin
- **WHEN** un usuario con rol `ADMIN` accede a un módulo
- **THEN** tiene acceso completo (CRUD) a todos los módulos incluyendo asignación de roles y configuración

### Requirement: Especialista Permissions

El rol `ESPECIALISTA` SHALL tener acceso limitado a los módulos operativos únicamente para los niños asignados, sin acceso a pagos, gastos, gestión de usuarios, configuración ni reportes administrativos.

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

#### Scenario: Acceso a niños asignados
- **WHEN** un especialista accede a un niño asignado
- **THEN** puede leer el expediente y gestionar actividades, asistencias e informes de ese niño

#### Scenario: Bloqueo de módulos administrativos
- **WHEN** un especialista intenta acceder a pagos, gastos, gestión de usuarios o configuración
- **THEN** el acceso es denegado

### Requirement: Personal Administrativo Permissions

El rol `PERSONAL_ADMINISTRATIVO` SHALL tener acceso CRUD a los módulos administrativos operativos, con consulta a personal y registro/consulta de gastos con autorización.

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

#### Scenario: Acceso de personal administrativo
- **WHEN** un usuario con rol `PERSONAL_ADMINISTRATIVO` trabaja con niños, inscripciones, pagos, asistencias o actividades
- **THEN** tiene acceso CRUD completo

#### Scenario: Restricciones del personal
- **WHEN** un usuario con rol `PERSONAL_ADMINISTRATIVO` intenta gestionar usuarios, configuración o informes de avance
- **THEN** el acceso es denegado

### Requirement: Role Assignment

La asignación de roles SHALL ser exclusiva del Admin, con un solo rol activo por usuario almacenado como enum en la tabla `users`.

- Solo el Admin puede asignar roles a usuarios
- Un usuario tiene un solo rol activo
- El rol se almacena en la tabla `users` como enum
- Cambio de rol requiere permiso de Admin

#### Scenario: Cambio de rol
- **WHEN** un Admin cambia el rol de un usuario
- **THEN** el usuario pasa a tener un único rol activo almacenado como enum en `users`

#### Scenario: Sin permiso de admin
- **WHEN** un usuario sin rol Admin intenta asignar roles
- **THEN** el sistema deniega el cambio de rol

### Requirement: Roles Decorator

El sistema SHALL proteger rutas por rol mediante el decorador `@Roles()` combinado con `JwtAuthGuard` y `RolesGuard`, retornando 403 para usuarios sin el rol requerido.

```typescript
@Roles('ADMIN')
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('users')
findAll() { ... }
```

- Decorador `@Roles()` acepta múltiples roles
- RolesGuard verifica el rol del usuario contra los roles permitidos
- Si el usuario no tiene el rol requerido, retorna 403 Forbidden

#### Scenario: Acceso con rol permitido
- **WHEN** un usuario con el rol requerido llama a una ruta protegida con `@Roles()`
- **THEN** el acceso es permitido

#### Scenario: Acceso sin rol requerido
- **WHEN** un usuario sin el rol requerido llama a una ruta protegida con `@Roles()`
- **THEN** el sistema retorna 403 Forbidden

### Requirement: Role-Based UI

El frontend SHALL adaptar el menú, rutas y botones de acción según el rol y redirigir al dashboard correspondiente tras el login.

El frontend debe:
- Ocultar/mostrar elementos del menú según el rol
- Bloquear acceso a rutas no autorizadas
- Mostrar/ocultar botones de acción según permisos
- Redirigir a dashboard correspondiente al rol al hacer login

#### Scenario: UI según rol
- **WHEN** un usuario inicia sesión
- **THEN** el frontend redirige al dashboard de su rol, muestra el menú filtrado y bloquea rutas no autorizadas

### Requirement: Future Extensibility

El sistema SHALL permitir agregar nuevos roles y configurar permisos por módulo sin modificar código existente.

- El sistema debe permitir agregar nuevos roles sin modificar código existente
- Los permisos deben poder configurarse por módulo
- Consideración para futuros roles: SUPERVISOR

#### Scenario: Nuevos roles
- **WHEN** se agrega un nuevo rol (por ejemplo `SUPERVISOR`)
- **THEN** se configura sin modificar código existente y los permisos se definen por módulo

### Requirement: Parents Are Not System Users

Los padres, madres o tutores SHALL NOT ser usuarios del sistema ni iniciar sesión. Sus datos residen como información del niño (`Child`), no en la tabla `users`.

- No existe rol `TUTOR`/`PADRE` para login en la plataforma
- El alta de usuarios es exclusiva del ADMIN (rol `ADMIN`)
- El portal de consulta para padres es una funcionalidad futura: **link público** donde el padre/madre/tutor consulta el historial y datos de sus niños validándose con su carnet (documento de identidad)
- El portal público deberá exponer únicamente información autorizada del niño y no requerirá credenciales de la plataforma

#### Scenario: Un padre intenta registrarse como usuario
- **WHEN** un padre/madre/tutor intenta crear una cuenta propia en la plataforma
- **THEN** no existe un endpoint público de registro y el acceso al sistema queda restringido a usuarios dados de alta por el ADMIN

#### Scenario: Portal futuro de padres
- **WHEN** en el futuro se implemente el portal para padres
- **THEN** se accede mediante un enlace público validando el carnet del padre/madre/tutor y solo se muestran datos autorizados de sus niños

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
| POST | /users | ADMIN | Create user (sin registro público) |
| PATCH | /users/:id/role | ADMIN | Change user role |
| GET | /children | ADMIN, PERSONAL | List all children |
| GET | /children/assigned | ESPECIALISTA | List assigned children |
| POST | /reports | ESPECIALISTA | Create progress report |
| GET | /reports | ADMIN | All reports |
| GET | /reports/mine | ESPECIALISTA | Own reports |