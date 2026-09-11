# User Profile Specification

## Purpose

Perfil de usuario en Sistema_PsicoTea. Define visualización y actualización de los propios datos, cambio de contraseña, UI de perfil y control de acceso para los tres roles autenticados.

## Requirements

### Requirement: View Own Profile

El sistema SHALL permitir a todo usuario autenticado ver sus propios datos de perfil (`name`, `lastName`, `email`, `role` solo lectura) en la pagina `/profile`, sin exponer datos de otros usuarios.

#### Scenario: Vista de perfil
- **WHEN** un usuario autenticado abre `/profile`
- **THEN** el sistema muestra sus datos propios obtenidos de `GET /auth/me`

#### Scenario: Sin autenticacion
- **WHEN** un usuario no autenticado abre `/profile`
- **THEN** el frontend lo redirige a `/login`

### Requirement: Update Own Profile

El sistema SHALL permitir al usuario autenticado actualizar sus propios `name`, `lastName` y `email` mediante el endpoint `PATCH /auth/me`, validando unicidad del correo y sin permitir el cambio de `role` o `isActive` (solo el ADMIN gestiona roles).

#### Scenario: Actualizacion exitosa
- **WHEN** el usuario actualiza su propio nombre/apellido/correo
- **THEN** el sistema guarda los cambios (con 200) y `GET /auth/me` refleja los nuevos datos

#### Scenario: Correo en uso
- **WHEN** el usuario intenta usar un correo ya registrado por otro usuario
- **THEN** el sistema rechaza con 409 y no modifica nada

#### Scenario: Rol inmutable desde el perfil
- **WHEN** el cliente envia `role` o `isActive` en `PATCH /auth/me`
- **THEN** el sistema los ignora y no los modifica

### Requirement: Change Own Password

El sistema SHALL permitir cambiar la propia contrasena mediante `PATCH /auth/password` (ya existente), validando la contrasena actual antes de aplicar la nueva, y revocando las sesiones (refresh tokens) del usuario.

#### Scenario: Constrasena correcta
- **WHEN** el usuario envia `currentPassword` correcta y una nueva contrasena valida
- **THEN** el sistema actualiza la contrasena (hasheada) y revoca los refresh tokens activos

#### Scenario: Constrasena actual incorrecta
- **WHEN** la `currentPassword` no coincide
- **THEN** el sistema devuelve 400/401 y mantiene la contrasena

#### Scenario: Nueva contrasena invalida
- **WHEN** la nueva contrasena no cumple la politica de longitud minima
- **THEN** el sistema rechaza con 400

### Requirement: Profile UI

El frontend SHALL habilitar la opcion "Mi perfil" del `UserMenu` navegando a `/profile`, accesible para cualquier rol autenticado, con formulario de datos propios y formulario de cambio de contrasena con fetch a los endpoints correspondientes.

#### Scenario: Acceso desde el menu
- **WHEN** un usuario autenticado hace clic en "Mi perfil"
- **THEN** navega a `/profile` protegida por `ProtectedRoute`

#### Scenario: Feedback de exito/error
- **WHEN** el usuario guarda cambios o cambia la contrasena
- **THEN** el frontend muestra notificacion de exito o error (toast)

### Requirement: Profile RBAC

El perfil SHALL estar disponible para los tres roles (ADMIN, ESPECIALISTA, PERSONAL_ADMINISTRATIVO) con las mismas capacidades; no requiere rol especifico mas alla de estar autenticado.

#### Scenario: Cualquier rol autenticado
- **WHEN** un ADMIN, ESPECIALISTA o PERSONAL_ADMINISTRATIVO accede a su perfil
- **THEN** todos pueden ver y editar sus propios datos y cambiar su contrasena