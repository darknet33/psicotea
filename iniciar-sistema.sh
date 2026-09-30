#!/usr/bin/env bash
# ============================================================
#  PsicoTea - Inicio automatico del sistema (Linux)
#  Detecta la IP LAN, actualiza los .env y levanta backend+front
#  Funciona en Ubuntu / Linux Mint (GNOME, XFCE, MATE, KDE)
#  Uso:  bash iniciar-sistema.sh   (o  ./iniciar-sistema.sh)
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo " ========================================================"
echo "  PsicoTea - Iniciando sistema..."
echo " ========================================================"
echo ""

# ---------------------------------------------------------
# 1. Detectar la IP LAN del equipo
# ---------------------------------------------------------
LAN_IP="$(ip -4 -o addr show scope global 2>/dev/null | awk '{print $4}' | cut -d/ -f1 | head -n1)"
if [ -z "$LAN_IP" ]; then
  LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}')"
fi
if [ -z "$LAN_IP" ]; then
  echo "  [ERROR] No se pudo detectar la IP de red."
  read -r -p "  Presiona Enter para salir..."
  exit 1
fi

echo "  IP LAN detectada : $LAN_IP"
echo ""

# ---------------------------------------------------------
# 2. Actualizar fronted/.env.local
# ---------------------------------------------------------
sed -i -E \
  "s|NEXT_PUBLIC_API_URL=https?://[^\r\n]*|NEXT_PUBLIC_API_URL=http://${LAN_IP}:3001|" \
  fronted/.env.local
sed -i -E \
  "s|NEXT_PUBLIC_WS_URL=https?://[^\r\n]*|NEXT_PUBLIC_WS_URL=http://${LAN_IP}:3001|" \
  fronted/.env.local
echo "  [OK] fronted/.env.local actualizado (http://${LAN_IP}:3001)"

# ---------------------------------------------------------
# 3. Actualizar backend/.env (CORS)
# ---------------------------------------------------------
sed -i -E \
  's|FRONTEND_URL="https?://[^"\r\n]*"|FRONTEND_URL="http://'"${LAN_IP}"':3000"|' \
  backend/.env
echo "  [OK] backend/.env actualizado (CORS FRONTEND_URL=http://${LAN_IP}:3000)"
echo ""

# ---------------------------------------------------------
# 4. Detectar un emulador de terminal disponible
# ---------------------------------------------------------
TERM_CMD=""
for term in gnome-terminal xfce4-terminal mate-terminal konsole x-terminal-emulator; do
  if command -v "$term" >/dev/null 2>&1; then
    TERM_CMD="$term"
    break
  fi
done

abrir_ventana() {
  # $1 = titulo, $2 = comando a ejecutar dentro de la ventana
  case "$TERM_CMD" in
    gnome-terminal)
      gnome-terminal --title="$1" -- bash -c "cd \"$2\" && $3; exec bash" >/dev/null 2>&1 &
      ;;
    xfce4-terminal | mate-terminal)
      "$TERM_CMD" --title="$1" -e "bash -c \"cd '$2' && $3; exec bash\"" >/dev/null 2>&1 &
      ;;
    konsole)
      konsole --title="$1" -e "bash -c \"cd '$2' && $3; exec bash\"" >/dev/null 2>&1 &
      ;;
    *)
      nohup bash -c "cd '$2' && $3" > "$SCRIPT_DIR/${4:-salida}.log" 2>&1 &
      ;;
  esac
}

echo "  Abriendo backend y frontend..."
echo "  (Cierra cada uno con Ctrl+C en su ventana)"
echo ""

# ---------------------------------------------------------
# 5. Abrir backend (puerto 3001) y frontend (puerto 3000)
# ---------------------------------------------------------
abrir_ventana "PsicoTea Backend" "$SCRIPT_DIR/backend" "npm run start:dev" "backend"
abrir_ventana "PsicoTea Frontend" "$SCRIPT_DIR/fronted" "npm run dev" "fronted"

echo "  Esperando a que los servidores levanten..."
sleep 12

# ---------------------------------------------------------
# 6. Abrir navegador en la IP LAN
# ---------------------------------------------------------
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://${LAN_IP}:3000/login" >/dev/null 2>&1 &
fi

echo ""
echo "  Todo listo:"
echo "    Backend : http://${LAN_IP}:3001"
echo "    Frontend: http://${LAN_IP}:3000/login"
echo "  Desde otros dispositivos de tu red usa esas mismas direcciones."
echo ""
exit 0