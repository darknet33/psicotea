## Why

Sistema_PsicoTea es una plataforma web para la gestión integral de un centro infantil dedicado al cuidado y desarrollo de niños con autismo y otras necesidades particulares. Actualmente solo existen archivos de entorno (.env) sin estructura de código definida. Es fundamental establecer la arquitectura técnica completa antes de iniciar el desarrollo para asegurar consistencia, modularidad, seguridad de datos de menores y una experiencia de usuario óptima para padres y profesionales.

## What Changes

- Definición del stack tecnológico: Next.js 14+ (App Router, PWA) + NestJS + MySQL + Prisma
- Sistema de autenticación JWT con refresh tokens y control de roles (Admin, Especialista, Personal Administrativo)
- Estructura de carpetas modular que permita agregar módulos sin rehacer el sistema
- WebSocket para notificaciones en tiempo real
- Selección de librerías UI (shadcn/ui + Tailwind CSS) para interfaz amigable, accesible y responsive
- Configuración de variables de entorno para desarrollo y producción
- Infraestructura para soportar todos los módulos del proyecto: Niños, Inscripciones, Pagos, Asistencias, Actividades, Informes, Especialistas, RRHH, Gastos y Landing Page

## Capabilities

### New Capabilities

- `auth-system`: Sistema de autenticación JWT con registro, login, refresh tokens, control de sesiones y guards para protección de rutas
- `user-roles`: Definición de roles (admin, especialista, personal_administrativo) con permisos diferenciados y sistema de autorización escalable
- `project-structure`: Estructura de carpetas y organización modular del código frontend (Next.js) y backend (NestJS)
- `ui-design-system`: Librería de componentes shadcn/ui, tema personalizado con Tailwind CSS, directrices de diseño para interfaz amigable y accesible
- `realtime-communication`: WebSocket gateway con Socket.io para notificaciones y comunicación en tiempo real

### Modified Capabilities

<!-- No hay capacidades existentes que se modifiquen -->

## Impact

- **Frontend**: Creación completa de la app Next.js con App Router, PWA, Axios con interceptores JWT, Zustand para estado global
- **Backend**: Creación completa del API REST con NestJS, módulos por dominio, Prisma ORM, JWT Strategy y Guards
- **Base de datos**: Esquema MySQL con tablas: User, Role, Child, Enrollment, Payment, Attendance, Activity, Report, Specialist, Staff, Expense
- **Dependencias**: Paquetes npm necesarios en frontend y backend
- **Variables de entorno**: Extensiones de .env.local y .env.produccion con JWT_SECRET, DB credentials, WS config
- **Seguridad**: Implementación de autenticación, autorización por roles, protección de datos de menores
- **Landing Page**: Página pública separada de la aplicación privada
