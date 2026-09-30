# Setup del proyecto (después de clone/pull)

Guía para dejar el proyecto funcionando en una máquina nueva. Todo lo que se detalla
aquí no viene en el repositorio (queda excluido por `.gitignore` o se genera solo).

## Instalación automática

En **Linux (Ubuntu/Linux Mint)** hay un instalador que replica la configuración que se
usa en Windows: herramientas del sistema (git, curl, Node 20+, MySQL), dependencias de
backend/frontend, `.env`, migraciones + seed y los skills de agentes (MCP context7,
find-skills, nestjs y react). Los MCP remotos y los skills OpenSpec ya viajan en el repo.

```bash
bash instalar-linux.sh              # instalación completa
bash instalar-linux.sh --skip-system   # ya tienes las herramientas del SO
bash instalar-linux.sh --skip-deps     # no toca npm ni .env
bash instalar-linux.sh --skip-db       # no corre migraciones/seed
```

En **Windows** el arranque es automático con `iniciar-sistema.bat`, que detecta la IP LAN,
actualiza los `.env` y levanta backend + frontend (ver sección 4).

## Requisitos previos

- Node.js 20+
- MySQL (local o remoto) con una base de datos llamada `psicotea_db`
- npm

## 1. Instalar dependencias

```bash
cd backend
npm install        # también sincroniza skills de Prisma y genera el cliente

cd ../fronted
npm install        # Next.js genera next-env.d.ts y .next automáticamente
```

Si el cliente de Prisma no se generara con el `npm install`:

```bash
cd backend
npx prisma generate
```

## 2. Crear los archivos de entorno

Estos archivos están excluidos del repo: hay que copiarlos desde las plantillas `.env.example`.

### `backend/.env`

Copiar `backend/.env.example` → `backend/.env`:

```env
DATABASE_URL="mysql://user:password@localhost:3306/psicotea_db"
JWT_SECRET="generar-aleatorio"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="generar-aleatorio"
JWT_REFRESH_EXPIRATION="7d"
PORT=3001
FRONTEND_URL="http://localhost:3000"
```

### `fronted/.env.local`

Copiar `fronted/.env.example` → `fronted/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

> Los `.env.produccion` que están trackeados son plantillas con placeholders, no secreto reales.

## 3. Base de datos (solo backend)

Las migraciones ya vienen en `backend/prisma/migrations`:

```bash
cd backend
npx prisma migrate deploy
```

Poblar datos de prueba (admin inicial, etc.):

```bash
npx prisma db seed
```

## 4. Levantar el proyecto

En **Windows** (con doble clic o desde consola):

```bat
iniciar-sistema.bat
```

Detecta la IP LAN, actualiza `fronted/.env.local` y `backend/.env` (CORS), abre el backend
(puerto 3001) y el frontend (puerto 3000) en ventanas separadas y abre el navegador en la IP
LAN, de modo que desde otros dispositivos de la red también funciona.

En **Linux**:

```bash
bash iniciar-sistema.sh
```

Manualmente, equivaldría a:

```bash
# Backend (puerto 3001)
cd backend
npm run start:dev

# Frontend (puerto 3000) — en otra terminal
cd fronted
npm run dev
```

## Archivos que NO hay que crear

Se generan automáticamente: `node_modules/`, `dist/`, `.next/`, `next-env.d.ts`,
`*.tsbuildinfo`, cliente de Prisma en `.prisma`, y las configs locales de agentes
(`backend/.agents`, `.claude`, `.cursor`, `.devin`).

## Verificación

- `cd backend && npm run lint && npm run build`
- `cd fronted && npm run lint && npm run build`
- Entrar a `http://localhost:3000/login` con el usuario del seed.