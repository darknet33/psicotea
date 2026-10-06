#!/usr/bin/env bash
#
# Levanta backend y frontend en pestañas separadas, con la IP de la red local
# detectada dinámicamente para que la app también se pueda abrir desde el
# móvil o la tablet.
#
#   ./dev.sh           verifica todo y abre los dos servicios en pestañas
#   ./dev.sh --check   solo verifica (no abre nada)
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/fronted"

BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

MODE="start"
[[ "${1:-}" == "--check" ]] && MODE="check"

BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'
GREEN=$'\033[32m'; YELLOW=$'\033[33m'; CYAN=$'\033[36m'; OFF=$'\033[0m'

info()  { printf '%s\n' "${DIM}  →${OFF} $*"; }
ok()    { printf '%s\n' "${GREEN}  ✓${OFF} $*"; }
warn()  { printf '%s\n' "${YELLOW}  !${OFF} $*"; }
fail()  { printf '%s\n' "${RED}  ✗${OFF} $*" >&2; }
head2() { printf '\n%s\n' "${BOLD}${CYAN}$*${OFF}"; }

# IP de la red local. Se prioriza la interfaz de la ruta por defecto (la que
# realmente sale a internet) y se descartan loopback y bridges de Docker,
# que no son alcanzables desde un móvil.
detect_lan_ip() {
  local ip=""
  local dev=""

  ip=$(ip -4 route get 1.1.1.1 2>/dev/null \
        | awk '{for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit }}') || true
  dev=$(ip -4 route get 1.1.1.1 2>/dev/null \
        | awk '{for (i = 1; i <= NF; i++) if ($i == "dev") { print $(i + 1); exit }}') || true

  if [[ -n "$ip" && "$ip" != 127.* && "$dev" != docker* && "$dev" != br-* && "$dev" != veth* ]]; then
    printf '%s' "$ip"
    return 0
  fi

  # Respaldo: primera IPv4 no interna que no viva en un bridge de Docker.
  ip=$(ip -4 -o addr show scope global 2>/dev/null \
        | grep -vE ' (docker|br-|veth)' \
        | awk '{ split($4, a, "/"); print a[1]; exit }') || true
  printf '%s' "$ip"
}

# Setea KEY=VALUE en un archivo .env, reemplazando la línea existente.
set_env() {
  local file="$1" key="$2" value="$3" tmp
  [[ -f "$file" ]] || touch "$file"
  tmp="$(mktemp)"
  if grep -qE "^[[:space:]]*${key}=" "$file"; then
    # Escapar & y | para que el valor con comas no se interprete en el sustituto.
    local esc="${value//\\/\\\\}"
    esc="${esc//&/\\&}"
    esc="${esc//|/\\|}"
    sed -E "s|^[[:space:]]*${key}=.*|${key}=${esc}|" "$file" > "$tmp"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
  mv "$tmp" "$file"
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { fail "falta el comando '$1'"; exit 1; }
}

free_port() {
  local port="$1"
  if ss -ltn "sport = :$port" 2>/dev/null | grep -q LISTEN; then
    warn "el puerto $port ya está ocupado — puede ser otro servicio tuyo"
  fi
}

printf '%s\n' "${BOLD}Psicotea · arranque de desarrollo${OFF}"

# ── 1. IP dinámica ────────────────────────────────────────────────────────────
head2 "1. Red local"
LAN_IP="$(detect_lan_ip)"

if [[ -z "$LAN_IP" ]]; then
  warn "no se detectó IP de red local; se usará localhost"
  LAN_IP="localhost"
  API_ORIGIN="http://localhost:${BACKEND_PORT}"
else
  ok "IP de la red local: ${BOLD}${LAN_IP}${OFF}"
  API_ORIGIN="http://${LAN_IP}:${BACKEND_PORT}"
  WEB_ORIGIN="http://${LAN_IP}:${FRONTEND_PORT}"
  info "desde el móvil: ${WEB_ORIGIN}"
fi

# ── 2. Configuración ─────────────────────────────────────────────────────────
head2 "2. Variables de entorno"
need_cmd node

for dir in "$BACKEND" "$FRONTEND"; do
  if [[ -d "$dir/node_modules" ]]; then
    ok "$(basename "$dir")/node_modules presente"
  else
    fail "$(basename "$dir")/node_modules falta — ejecuta 'npm install' en $dir"
    exit 1
  fi
done

if [[ -f "$BACKEND/.env" ]]; then
  ok "backend/.env presente"
else
  fail "backend/.env falta (NestJS y Prisma solo leen .env, no .env.local)"
  info "cp backend/.env.example backend/.env  y rellena DATABASE_URL y los secretos"
  exit 1
fi

for var in DATABASE_URL JWT_SECRET JWT_REFRESH_SECRET CREDENTIAL_SECRET; do
  value=$(grep -E "^${var}=" "$BACKEND/.env" | head -1 | cut -d= -f2- | tr -d '"' || true)
  if [[ -z "$value" ]]; then
    fail "backend/.env no define $var"
    MISSING_VARS=1
  elif [[ "$value" == *"your-"* || "$value" == *"placeholder"* || "$value" == *"generar"* ]]; then
    fail "$var tiene un valor de ejemplo: $value"
    MISSING_VARS=1
  fi
done
if [[ -z "${MISSING_VARS:-}" ]]; then
  ok "secretos del backend definidos"
fi

# El front CORS tiene que permitir el origen por IP, si no el navegador del
# móvil bloquea todas las peticiones a la API.
current_frontend_url=$(grep -E '^FRONTEND_URL=' "$BACKEND/.env" | cut -d= -f2- | tr -d '"' || true)
if [[ "$current_frontend_url" != *"${LAN_IP}:${FRONTEND_PORT}"* ]]; then
  set_env "$BACKEND/.env" FRONTEND_URL \
    "http://localhost:${FRONTEND_PORT},http://${LAN_IP}:${FRONTEND_PORT}"
  ok "FRONTEND_URL permitir CORS desde http://${LAN_IP}:${FRONTEND_PORT}"
else
  ok "FRONTEND_URL ya incluye http://${LAN_IP}:${FRONTEND_PORT}"
fi

# El navegador del móvil tiene que poder alcanzar la API, así que aquí no vale
# localhost: tiene que ser la IP de la red.
if [[ "$LAN_IP" != "localhost" ]]; then
  set_env "$FRONTEND/.env.local" NEXT_PUBLIC_API_URL "$API_ORIGIN"
  set_env "$FRONTEND/.env.local" NEXT_PUBLIC_WS_URL "$API_ORIGIN"
  ok "fronted/.env.local apunta la API a ${API_ORIGIN}"
fi

# ── 3. Base de datos ─────────────────────────────────────────────────────────
head2 "3. Base de datos"
if ! need_cmd mysql; then
  fail "el cliente 'mysql' no está instalado; se omite la verificación"
else
  db_url=$(grep -E '^DATABASE_URL=' "$BACKEND/.env" | cut -d= -f2- | tr -d '"')
  db_host=$(node -e "console.log(new URL(process.argv[1]).hostname)" "$db_url" 2>/dev/null || echo localhost)
  db_port=$(node -e "console.log(new URL(process.argv[1]).port||'3306')" "$db_url" 2>/dev/null || echo 3306)
  db_user=$(node -e "console.log(decodeURIComponent(new URL(process.argv[1]).username))" "$db_url" 2>/dev/null || echo root)
  db_pass=$(node -e "console.log(decodeURIComponent(new URL(process.argv[1]).password))" "$db_url" 2>/dev/null || echo "")
  db_name=$(node -e "console.log(new URL(process.argv[1]).pathname.slice(1))" "$db_url" 2>/dev/null || echo psicotea_db)

  if ss -ltn "sport = :$db_port" 2>/dev/null | grep -q LISTEN; then
    ok "MySQL escuchando en ${db_host}:${db_port}"
  else
    fail "no hay nada escuchando en ${db_host}:${db_port} — arranca MySQL"
    exit 1
  fi

  if MYSQL_PWD="$db_pass" mysql -h "$db_host" -P "$db_port" -u "$db_user" \
       -e "USE \`$db_name\`;" >/dev/null 2>&1; then
    ok "credenciales válidas y base '${db_name}' accesible"
  else
    fail "no se pudo conectar a ${db_name} con el usuario '${db_user}'"
    info "revisa DATABASE_URL en backend/.env"
    exit 1
  fi

  # El cliente de Prisma se genera desde el schema, no desde la base: si quedó
  # viejo, los tipos no cuadran aunque la base esté bien.
  info "comprobando el cliente de Prisma…"
  if (cd "$BACKEND" && npx prisma migrate status >/dev/null 2>&1); then
    ok "todas las migraciones aplicadas"
  else
    warn "las migraciones no están al día o el cliente está desactualizado"
    info "cd backend && npx prisma generate && npx prisma migrate deploy"
  fi
fi

free_port "$BACKEND_PORT"
free_port "$FRONTEND_PORT"

if [[ "$MODE" == "check" ]]; then
  printf '\n%s\n' "${GREEN}${BOLD}Verificación completa.${OFF} (--check: no se abrió nada)\n"
  exit 0
fi

# ── 4. Arranque en pestañas ──────────────────────────────────────────────────
head2 "4. Arrancando"
need_cmd gnome-terminal

gnome-terminal --tab --title="Psicotea · Backend" \
  --working-directory="$BACKEND" \
  -- bash -lc "echo '  Backend → http://localhost:${BACKEND_PORT}  (red: ${API_ORIGIN})'; echo; npm run start:dev; echo; echo '  Backend detenido. Presioná Enter para cerrar.'; read -r"

gnome-terminal --tab --title="Psicotea · Frontend" \
  --working-directory="$FRONTEND" \
  -- bash -lc "echo '  Frontend → http://localhost:${FRONTEND_PORT}'; echo; npm run dev; echo; echo '  Frontend detenido. Presioná Enter para cerrar.'; read -r"

sleep 2
ok "backend y frontend abiertos en pestañas separadas"
printf '\n  %s\n' "${BOLD}Abrí:${OFF} http://localhost:${FRONTEND_PORT}"
[[ "$LAN_IP" != "localhost" ]] && \
  printf '  %s\n' "${BOLD}Desde el móvil (misma wifi):${OFF} http://${LAN_IP}:${FRONTEND_PORT}"
printf '\n'
