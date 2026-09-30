#!/usr/bin/env bash
# ============================================================
#  PsicoTea - Instalador de Linux (Ubuntu / Linux Mint)
#  Replica la configuracion que se tiene en Windows:
#    - Herramientas del sistema (git, curl, Node 20+, MySQL)
#    - Dependencias de backend y frontend
#    - Archivos .env a partir de las plantillas
#    - Migraciones + seed de la base de datos
#    - Skills de opencode/agentes (MCP y demas): context7-mcp,
#      find-skills, nestjs-best-practices, react-best-practices
#    - Los MCP remotos (context7/stitch) y skills de OpenSpec ya
#      vienen en el repo (opencode.json y .opencode/), no hay que
#      instalar nada para ellos.
#
#  Uso:
#    bash instalar-linux.sh           # modo interactivo (pide sudo)
#    bash instalar-linux.sh --skip-system   # no instala paquetes del SO
#    bash instalar-linux.sh --skip-deps     # no toca npm ni .env
#    bash instalar-linux.sh --skip-db       # no corre migraciones/seed
# ============================================================

set -uo pipefail

SKIP_SYSTEM=0
SKIP_DEPS=0
SKIP_DB=0

for arg in "$@"; do
  case "$arg" in
    --skip-system) SKIP_SYSTEM=1 ;;
    --skip-deps)   SKIP_DEPS=1 ;;
    --skip-db)     SKIP_DB=1 ;;
    *) echo "  Argumento desconocido: $arg"; exit 1 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo " ========================================================"
echo "  PsicoTea - Instalador para Ubuntu / Linux Mint"
echo " ========================================================"
echo ""

# ------------------------------------------------------------
# 1. Herramientas del sistema (requiere sudo)
# ------------------------------------------------------------
if [ "$SKIP_SYSTEM" -eq 0 ]; then
  echo "=== 1/5 Herramientas del sistema ==="

  NEEDS_INSTALL=()
  command -v git >/dev/null 2>&1 || NEEDS_INSTALL+=("git")
  command -v curl >/dev/null 2>&1 || NEEDS_INSTALL+=("curl")

  NODE_OK=0
  if command -v node >/dev/null 2>&1; then
    NODE_MAJOR="$(node --version | sed -E 's/^v([0-9]+).*/\1/')"
    if [ "${NODE_MAJOR:-0}" -ge 20 ]; then
      NODE_OK=1
    fi
  fi
  [ "$NODE_OK" -eq 1 ] || NEEDS_INSTALL+=("nodejs")

  if [ ${#NEEDS_INSTALL[@]} -gt 0 ]; then
    echo "  Se instalaran: ${NEEDS_INSTALL[*]}"
    sudo apt-get update -y
    if [ "$NODE_OK" -eq 0 ]; then
      # NodeSource: asegura Node 20.x en Ubuntu/Linux Mint.
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - || {
        echo "  [WARN] Fallo NodeSource; se intenta con los paquetes de la distro."
        sudo apt-get install -y nodejs npm
      }
    fi
    # Lo que siga faltando despues de NodeSource (git, curl).
    sudo apt-get install -y "${NEEDS_INSTALL[@]}" || {
      echo "  [WARN] Fallo al instalar paquetes; revisa los errores."
    }
  else
    echo "  git, curl, node/npm ya estan disponibles (Node $(node -v))."
  fi

  # MySQL: solo si no esta instalado el servidor.
  if ! command -v mysqld >/dev/null 2>&1 && ! command -v mariadbd >/dev/null 2>&1; then
    echo "  Instalando MySQL Server..."
    sudo apt-get install -y mysql-server || {
      echo "  [WARN] No se instalo MySQL. Instalalo manualmente."
    }
  fi

  # Asegurar que el servicio MySQL/MariaDB este corriendo.
  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl enable mysql >/dev/null 2>&1 || sudo systemctl enable mariadb >/dev/null 2>&1 || true
    sudo systemctl start mysql >/dev/null 2>&1 || sudo systemctl start mariadb >/dev/null 2>&1 || true
  fi
  echo ""
fi

# ------------------------------------------------------------
# 2. Dependencias de backend y frontend
# ------------------------------------------------------------
if [ "$SKIP_DEPS" -eq 0 ]; then
  echo "=== 2/5 Dependencias npm ==="

  if [ ! -d backend/node_modules ]; then
    echo "  Instalando dependencias del backend..."
    (cd backend && npm install) || echo "  [WARN] Falla en backend/npm install."
  else
    echo "  backend/node_modules ya existe, se omite."
  fi

  if [ ! -d fronted/node_modules ]; then
    echo "  Instalando dependencias del frontend..."
    (cd fronted && npm install) || echo "  [WARN] Falla en fronted/npm install."
  else
    echo "  fronted/node_modules ya existe, se omite."
  fi
  echo ""
fi

# ------------------------------------------------------------
# 3. Archivos de entorno (.env)
# ------------------------------------------------------------
if [ "$SKIP_DEPS" -eq 0 ]; then
  echo "=== 3/5 Archivos de entorno ==="

  if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "  Copiado backend/.env desde .env.example"
  fi

  if grep -q "mysql://user:password" backend/.env 2>/dev/null; then
    echo "  [IMPORTANTE] backend/.env tiene credenciales de base de datos por defecto."
    echo "               Editalas antes de arrancar (usuario/contraseña de MySQL)."
  fi

  if [ ! -f fronted/.env.local ]; then
    cp fronted/.env.example fronted/.env.local
    echo "  Copiado fronted/.env.local desde .env.example"
  fi
  echo ""
fi

# ------------------------------------------------------------
# 4. Base de datos: migraciones + seed
# ------------------------------------------------------------
if [ "$SKIP_DB" -eq 0 ]; then
  echo "=== 4/5 Base de datos ==="

  # Trata de crear la base de datos psicotea_db si no existe (mejor esfuerzo).
  sudo mysql -e "CREATE DATABASE IF NOT EXISTS psicotea_db" >/dev/null 2>&1 && {
    echo "  Base de datos 'psicotea_db' verificada/creada."
  } || {
    echo "  [WARN] No se pudo verificar la base. Confirma DATABASE_URL en backend/.env"
  }

  echo "  Aplicando migraciones de Prisma..."
  (cd backend && npx prisma migrate deploy) || echo "  [WARN] Falla 'prisma migrate deploy'."

  echo "  Generando cliente de Prisma..."
  (cd backend && npx prisma generate) || echo "  [WARN] Falla 'prisma generate'."

  echo "  Poblando datos iniciales (seed)..."
  (cd backend && npx prisma db seed) || echo "  [WARN] Falla 'prisma db seed' (¿esta configurada la BD?)."
  echo ""
fi

# ------------------------------------------------------------
# 5. Skills de agentes / MCP (igual que en Windows)
# ------------------------------------------------------------
echo "=== 5/5 Skills de opencode (agentes/MCP) ==="

# opencode.json (MCP remotos context7 + stitch) y .opencode/ ya estan en el repo.
if [ -f opencode.json ]; then
  echo "  [OK] MCP remotos (context7, stitch) y skills OpenSpec del repo listos."
fi

# context7-mcp -> upstash/context7
if [ ! -f "$HOME/.agents/skills/context7-mcp/SKILL.md" ]; then
  echo "  Instalando skill context7-mcp..."
  npx -y skills add upstash/context7@context7-mcp || echo "  [WARN] Falla al instalar context7-mcp."
else
  echo "  context7-mcp ya instalado."
fi

# find-skills -> vercel-labs/skills
if [ ! -f "$HOME/.agents/skills/find-skills/SKILL.md" ]; then
  echo "  Instalando skill find-skills..."
  npx -y skills add vercel-labs/skills@find-skills || echo "  [WARN] Falla al instalar find-skills."
else
  echo "  find-skills ya instalado."
fi

# nestjs-best-practices (del skills-lock.json del repo)
if [ ! -f "$HOME/.agents/skills/nestjs-best-practices/SKILL.md" ]; then
  echo "  Instalando skill nestjs-best-practices..."
  npx -y skills add kadajett/agent-nestjs-skills@nestjs-best-practices || echo "  [WARN] Falla al instalar nestjs-best-practices."
else
  echo "  nestjs-best-practices ya instalado."
fi

# react-best-practices (del skills-lock.json del repo)
if [ ! -f "$HOME/.agents/skills/vercel-react-best-practices/SKILL.md" ]; then
  echo "  Instalando skill react-best-practices..."
  npx -y skills add vercel-labs/agent-skills@react-best-practices || echo "  [WARN] Falla al instalar react-best-practices."
else
  echo "  react-best-practices ya instalado."
fi

echo ""
echo " ========================================================"
echo "  Instalacion terminada."
echo ""
echo "  Proximos pasos:"
echo "   1. Edita backend/.env si hace falta (DATABASE_URL)."
echo "   2. Arranca el sistema con:  bash iniciar-sistema.sh"
echo "   3. Entra a http://localhost:3000/login (admin@psicotea.com / Admin1234)"
echo " ========================================================"
echo ""
exit 0