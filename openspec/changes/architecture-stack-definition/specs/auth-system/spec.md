# Auth System Specification

## Overview

Sistema de autenticación JWT para control de acceso a la plataforma Sistema_PsicoTea.

## Requirements

### REQ-AUTH-001: User Creation (Admin Only)

La plataforma NO tiene registro público. Los usuarios solo son creados por un ADMIN mediante el CRUD de usuarios. El endpoint `POST /auth/register` no existe.

- **Endpoint**: POST /users
- **Header**: Authorization: Bearer `<access_token>` (rol ADMIN requerido)
- **Request Body**:
  - `email`: string (required, unique, valid email format)
  - `password`: string (required, min 8 chars, uppercase, lowercase, number)
  - `name`: string (required)
  - `lastName`: string (required)
  - `role`: enum [ADMIN, ESPECIALISTA, PERSONAL_ADMINISTRATIVO] (required)
- **Response**: 201 Created `{ id, email, name, lastName, role, isActive }`
- **Errors**:
  - 400: Invalid data
  - 403: Usuario sin rol ADMIN
  - 409: Email already exists
- **Security**: Password hashed with bcrypt (10 rounds)

### REQ-AUTH-002: User Login

- **Endpoint**: POST /auth/login
- **Request Body**:
  - `email`: string (required)
  - `password`: string (required)
- **Response**: 200 OK { access_token, refresh_token, user: { id, email, name, lastName, role } }
- **Errors**:
  - 401: Invalid credentials
  - 400: Invalid data
- **Security**: Rate limiting (5 attempts per IP per 15 min)

### REQ-AUTH-003: Token Refresh

- **Endpoint**: POST /auth/refresh
- **Header**: Authorization: Bearer <refresh_token>
- **Response**: 200 OK { access_token }
- **Errors**:
  - 401: Invalid or expired refresh token
- **Security**: Refresh token is single-use (rotated on each refresh)

### REQ-AUTH-004: Get Current User

- **Endpoint**: GET /auth/me
- **Header**: Authorization: Bearer <access_token>
- **Response**: 200 OK { id, email, name, lastName, role, isActive }
- **Errors**:
  - 401: Invalid or expired token

### REQ-AUTH-005: Logout

- **Endpoint**: POST /auth/logout
- **Header**: Authorization: Bearer <access_token>
- **Response**: 200 OK { message: "Logged out" }
- **Behavior**: Invalidates refresh token in database

### REQ-AUTH-006: Password Change

- **Endpoint**: PATCH /auth/password
- **Header**: Authorization: Bearer <access_token>
- **Request Body**:
  - `currentPassword`: string (required)
  - `newPassword`: string (required, min 8 chars)
- **Response**: 200 OK { message: "Password updated" }
- **Errors**:
  - 401: Current password incorrect

### REQ-AUTH-007: JWT Configuration

- **Access Token Expiration**: 15 minutes
- **Refresh Token Expiration**: 7 days
- **Token Format**: Bearer token in Authorization header
- **Payload**: { sub: userId, email, role, iat, exp }

### REQ-AUTH-008: Protected Routes

- Todas las rutas excepto `/auth/login` y las rutas públicas (portal/landing) requieren un JWT válido
- No existe endpoint público de registro de usuarios
- JwtAuthGuard applied globally or per-route
- Invalid/missing token returns 401 Unauthorized

### REQ-AUTH-009: Password Storage

- Passwords hashed using bcrypt with 10 salt rounds
- Plain text passwords never stored or logged
- Password field excluded from all API responses

## Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /users | ADMIN | Create user (no public registration, role required) |
| POST | /auth/login | No | Login and get tokens |
| POST | /auth/refresh | Refresh Token | Refresh access token |
| GET | /auth/me | Access Token | Get current user |
| POST | /auth/logout | Access Token | Logout and invalidate refresh |
| PATCH | /auth/password | Access Token | Change password |
