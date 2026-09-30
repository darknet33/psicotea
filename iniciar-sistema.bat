@echo off
setlocal enableextensions enabledelayedexpansion
REM ============================================================
REM  PsicoTea - Inicio automatico del sistema
REM  Detecta la IP LAN, actualiza los .env y levanta backend+front
REM ============================================================

chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  ========================================================
echo   PsicoTea - Iniciando sistema...
echo  ========================================================
echo.

REM ---------- Detectar IP LAN del equipo ----------
for /f "usebackq tokens=*" %%i in (`powershell -NoProfile -Command "$if = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -ne $null } | Select-Object -First 1; if ($if) { $if.IPv4Address.IPAddress } else { '0.0.0.0' }"`) do set "LAN_IP=%%i"

if "%LAN_IP%"=="" (
  echo  [ERROR] No se pudo detectar la IP de red.
  pause
  exit /b 1
)

echo  IP LAN detectada : %LAN_IP%
echo.

REM ---------- Actualizar los .env ----------
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0actualizar-env.ps1" "%LAN_IP%"
if %errorlevel% NEQ 0 (
  echo  [ERROR] No se pudieron actualizar los archivos .env
  pause
  exit /b 1
)
echo.
echo  Abriendo backend y frontend...
echo  (Cierra cada uno con Ctrl+C en su ventana)
echo.

REM ---------- Abrir backend (puerto 3001) ----------
start "PsicoTea Backend" cmd /k "cd /d %~dp0backend && npm run start:dev"

REM ---------- Abrir frontend (puerto 3000) ----------
start "PsicoTea Frontend" cmd /k "cd /d %~dp0fronted && npm run dev"

echo  Esperando a que los servidores levanten...
timeout /t 12 /nobreak >nul

REM ---------- Abrir navegador en la IP LAN ----------
start "" "http://%LAN_IP%:3000/login"

echo.
echo  Todo listo:
echo    Backend : http://%LAN_IP%:3001
echo    Frontend: http://%LAN_IP%:3000/login
echo  Desde otros dispositivos de tu red usa esas mismas direcciones.
echo.
endlocal
exit /b 0