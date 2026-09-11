# Auth System Specification

## Purpose

Autenticación JWT para control de acceso a la plataforma Sistema_PsicoTea. Define creación de usuarios por el ADMIN (sin registro público), login, refresh de tokens, obtención del usuario actual, logout, cambio de contraseña, configuración JWT, rutas protegidas y almacenamiento de contraseñas.

## Requirements

### Requirement: User Creation (Admin Only)

La plataforma SHALL NOT tener registro público. Los usuarios solo son creados por un ADMIN mediante el CRUD de usuarios; el endpoint `POST /auth/register` no existe.

- **Endpoint**: POST /users
- **Header**: Authorization: Bearer `<access_token>` (rol ADMIN requerido)
- **Request Body**:
  - `email`: string (required, unique, valid email format)
  - `password`: string (required, min 8 chars, uppercase, lowercase, number)
  - `name`: string (required)
  - `lastName`: string (required)
  - `role`: enum [ADMIN, ESPECIALISTA, PERSONAL_ADMINISTRATIVO] (required)
- **Response**: 201 Created `{ id, email, name, lastName, role, isActive }`
- **Security**: Password hashed con bcrypt (10 rounds)

#### Scenario: Alta de usuario por admin
- **WHEN** un usuario con rol `ADMIN` envía datos válidos a `POST /users`
- **THEN** el sistema responde 201 Created con `{ id, email, name, lastName, role, isActive }`

#### Scenario: Intento de registro público
- **WHEN** una persona intenta crear una cuenta desde un endpoint público
- **THEN** el sistema no expone ningún endpoint de registro y responde 404 en `POST /auth/register`

#### Scenario: Email duplicado
- **WHEN** un admin crea un usuario con un email ya existente
- **THEN** el sistema responde 409 Conflict

#### Scenario: Datos inválidos
- **WHEN** se envían datos que no cumplen las validaciones del request body
- **THEN** el sistema responde 400 Bad Request

#### Scenario: Sin permiso de admin
- **WHEN** un usuario sin rol `ADMIN` intenta crear un usuario
- **THEN** el sistema responde 403 Forbidden

### Requirement: User Login

El sistema SHALL autenticar usuarios por email y contraseña y emitir tokens de acceso y refresh.

- **Endpoint**: POST /auth/login
- **Request Body**:
  - `email`: string (required)
  - `password`: string (required)
- **Response**: 200 OK `{ access_token, refresh_token, user: { id, email, name, lastName, role } }`
- **Security**: Rate limiting (5 intentos por IP por 15 min)

#### Scenario: Credenciales válidas
- **WHEN** un usuario envía credenciales correctas a `POST /auth/login`
- **THEN** el sistema responde 200 OK con `access_token`, `refresh_token` y los datos del usuario

#### Scenario: Credenciales inválidas
- **WHEN** un usuario envía credenciales incorrectas
- **THEN** el sistema responde 401 Unauthorized

#### Scenario: Límite de intentos superado
- **WHEN** un usuario supera 5 intentos fallidos desde la misma IP en 15 minutos
- **THEN** el sistema bloquea temporalmente nuevos intentos

### Requirement: Token Refresh

El sistema SHALL permitir renovar un access token expirado usando un refresh token de un solo uso (rotado en cada refresh).

- **Endpoint**: POST /auth/refresh
- **Header**: Authorization: Bearer `<refresh_token>`
- **Response**: 200 OK `{ access_token }`

#### Scenario: Refresh token válido
- **WHEN** un usuario envía un refresh token válido a `POST /auth/refresh`
- **THEN** el sistema responde 200 OK con un nuevo `access_token` e invalida el refresh token usado

#### Scenario: Refresh token inválido o expirado
- **WHEN** un usuario envía un refresh token inválido o expirado
- **THEN** el sistema responde 401 Unauthorized

### Requirement: Get Current User

El sistema SHALL retornar el perfil del usuario autenticado.

- **Endpoint**: GET /auth/me
- **Header**: Authorization: Bearer `<access_token>`
- **Response**: 200 OK `{ id, email, name, lastName, role, isActive }`

#### Scenario: Token válido
- **WHEN** un usuario autenticado solicita `GET /auth/me`
- **THEN** el sistema responde 200 OK con `{ id, email, name, lastName, role, isActive }`

#### Scenario: Token inválido o expirado
- **WHEN** un usuario envía un access token inválido o expirado
- **THEN** el sistema responde 401 Unauthorized

### Requirement: Logout

El sistema SHALL invalidar el refresh token en base de datos al hacer logout.

- **Endpoint**: POST /auth/logout
- **Header**: Authorization: Bearer `<access_token>`
- **Response**: 200 OK `{ message: "Logged out" }`

#### Scenario: Logout exitoso
- **WHEN** un usuario autenticado envía `POST /auth/logout`
- **THEN** el sistema responde 200 OK y el refresh token queda invalidado en base de datos

### Requirement: Password Change

El sistema SHALL permitir al usuario autenticado cambiar su contraseña indicando la actual.

- **Endpoint**: PATCH /auth/password
- **Header**: Authorization: Bearer `<access_token>`
- **Request Body**:
  - `currentPassword`: string (required)
  - `newPassword`: string (required, min 8 chars)
- **Response**: 200 OK `{ message: "Password updated" }`

#### Scenario: Contraseña actual correcta
- **WHEN** un usuario envía su contraseña actual correcta y una nueva contraseña válida
- **THEN** el sistema responde 200 OK `{ message: "Password updated" }`

#### Scenario: Contraseña actual incorrecta
- **WHEN** un usuario envía una contraseña actual incorrecta
- **THEN** el sistema responde 401 Unauthorized

### Requirement: JWT Configuration

El sistema SHALL emitir tokens JWT con expiración de 15 minutos para acceso y 7 días para refresh.

- **Access Token Expiration**: 15 minutes
- **Refresh Token Expiration**: 7 days
- **Token Format**: Bearer token en el header Authorization
- **Payload**: `{ sub: userId, email, role, iat, exp }`

#### Scenario: Emisión de tokens
- **WHEN** el sistema emite tokens en login o refresh
- **THEN** el access token expira a los 15 minutos, el refresh token a los 7 días, y el payload contiene `{ sub, email, role, iat, exp }`

### Requirement: Protected Routes

El sistema SHALL proteger todas las rutas excepto `/auth/login` y las rutas públicas (portal/landing), requiriendo un JWT válido. No existe endpoint público de registro.

- `JwtAuthGuard` aplicado globalmente o por ruta
- Token inválido o ausente responde 401 Unauthorized

#### Scenario: Acceso con token válido
- **WHEN** un usuario accede a una ruta protegida con un JWT válido
- **THEN** el sistema permite el acceso

#### Scenario: Acceso sin token o token inválido
- **WHEN** un usuario accede a una ruta protegida sin token o con token inválido
- **THEN** el sistema responde 401 Unauthorized

### Requirement: Password Storage

El sistema SHALL almacenar contraseñas hasheadas con bcrypt (10 salt rounds) y nunca en texto plano.

- Passwords hashed usando bcrypt con 10 salt rounds
- Plain text passwords nunca se almacenan ni loguean
- El campo password se excluye de todas las respuestas de la API

#### Scenario: Contraseña nunca expuesta
- **WHEN** un usuario se registra o cambia su contraseña
- **THEN** el sistema almacena únicamente el hash bcrypt y el password nunca aparece en respuestas ni logs

## Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /users | ADMIN | Create user (sin registro público, rol requerido) |
| POST | /auth/login | No | Login and get tokens |
| POST | /auth/refresh | Refresh Token | Refresh access token |
| GET | /auth/me | Access Token | Get current user |
| POST | /auth/logout | Access Token | Logout and invalidate refresh |
| PATCH | /auth/password | Access Token | Change password |