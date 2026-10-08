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
- `gnome-terminal` (lo usa `dev.sh` para abrir los servicios en pestañas)

## 1. Arrancar todo de una vez

```bash
./dev.sh
```

El script verifica el entorno de punta a punta y abre backend y frontend en dos
pestañas separadas de `gnome-terminal`:

1. Detecta la **IP de la red local** (descarta loopback y bridges de Docker) y
   la escribe en los `.env` para que la app también se pueda abrir desde el móvil.
2. Comprueba que existan `node_modules`, `backend/.env` y los secretos obligatorios.
3. Comprueba que MySQL esté levantado y que las credenciales de `DATABASE_URL` sirvan.
4. Avisa si las migraciones de Prisma no están al día.

Para solo verificar, sin abrir nada:

```bash
./dev.sh --check
```

## 2. Instalación manual (si no usás `dev.sh`)

### Dependencias

```bash
cd backend   && npm install   # también sincroniza skills de Prisma y genera el cliente
cd ../fronted && npm install  # Next.js genera next-env.d.ts y .next automáticamente
```

Si el cliente de Prisma no se generara con el `npm install`:

```bash
cd backend && npx prisma generate
```

### Archivos de entorno

Estos archivos están excluidos del repo: hay que crearlos a mano.

> **Ojo:** NestJS (`ConfigModule.forRoot`) y el CLI de Prisma leen **`.env`**, no
> `.env.local`. Un `backend/.env.local` no se carga y el backend arranca sin
> `DATABASE_URL`.

#### `backend/.env`

Copiar `backend/.env.example` → `backend/.env` y completar:

| Variable | Obligatoria | Notas |
| --- | --- | --- |
| `DATABASE_URL` | sí | `mysql://user:password@localhost:3306/psicotea_db` |
| `JWT_SECRET` | sí | 32 bytes hex aleatorios |
| `JWT_EXPIRATION` | no | por defecto `15m` |
| `JWT_REFRESH_SECRET` | sí | 32 bytes hex aleatorios |
| `JWT_REFRESH_EXPIRATION` | no | por defecto `7d` |
| `CREDENTIAL_SECRET` | sí | firma los tokens de credencial (QR). Si falta, el login por QR falla en runtime |
| `PORT` | no | por defecto `3001` |
| `HOST` | no | `0.0.0.0` deja el backend accesible por IP de la red local |
| `NODE_ENV` | no | `development` \| `production` |
| `FRONTEND_URL` | no | orígenes CORS separados por coma. `dev.sh` añade el de la IP local |
| `UPLOAD_DIR` | no | por defecto `uploads`, relativo al cwd del backend |

Generar los tres secretos de una vez:

```bash
node -e "const c=require('crypto');for(const k of ['JWT_SECRET','JWT_REFRESH_SECRET','CREDENTIAL_SECRET'])console.log(k+'='+c.randomBytes(32).toString('hex'))"
```

Los secretos de `.env.example` son valores de ejemplo (`your-jwt-secret-here`);
`dev.sh` los rechaza si detecta que no se reemplazaron.

#### `fronted/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

`NEXT_PUBLIC_API_URL` tiene que ser alcanzable **desde el dispositivo que abre la
app**: si abrís la web en el móvil, `localhost` apunta al móvil y no al PC, por
eso `dev.sh` lo apunta a la IP de la red local.

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

> Usuario del seed: `admin@psicotea.com` / `Admin1234`.

### Migraciones y datos existentes

Algunas migraciones asumen que la base ya está en un estado concreto:

- `20260926010053_credential_code_required` requiere que **todos** los niños tengan
  `credentialCode`. Si la tabla `Child` ya tiene filas, generar los tokens antes:
  ```bash
  cd backend && npx ts-node prisma/backfill-credential-codes.ts
  ```
  Es idempotente y reutiliza `CredentialTokenService`, así que la firma coincide
  con la que valida la app.

- Los nombres de tabla son **sensibles a mayúsculas** en Linux
  (`lower_case_table_names=0`): escribí `Child`, no `child`. MySQL en Windows o
  macOS no distingue, y una migración escrita ahí puede fallar al aplicarla en
  Linux.

## 4. Levantar el proyecto a mano

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
- `./dev.sh --check`
- Entrar a `http://localhost:3000/login` con el usuario del seed.

> El build del backend necesita `@types/multer` (va en `devDependencies`). Si
> `npm run build` falla con `Could not find a declaration file for module 'multer'`,
> el `node_modules` está desactualizado: corré `npm install` en `backend`.
