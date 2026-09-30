# Actualiza las URLs de los archivos de entorno con la IP LAN detectada.
# Lo invoca iniciar-sistema.bat con la IP como argumento.
param(
  [Parameter(Mandatory = $true)]
  [string]$LanIp
)

$ErrorActionPreference = 'Stop'

function Update-File {
  param(
    [string]$Path,
    [string]$Pattern,
    [string]$Replacement
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    Write-Error "No se encontro el archivo: $Path"
    return
  }

  $content = [System.IO.File]::ReadAllText(
    (Resolve-Path -LiteralPath $Path),
    [System.Text.Encoding]::UTF8
  )

  $content = [regex]::Replace($content, $Pattern, $Replacement)

  [System.IO.File]::WriteAllText(
    (Resolve-Path -LiteralPath $Path),
    $content,
    (New-Object System.Text.UTF8Encoding $false)
  )
  Write-Host "[OK] $Path"
}

$baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# fronted/.env.local: API y WS apuntan al backend en la IP LAN
Update-File `
  -Path (Join-Path $baseDir 'fronted\.env.local') `
  -Pattern 'NEXT_PUBLIC_API_URL=https?://[^\r\n]*' `
  -Replacement "NEXT_PUBLIC_API_URL=http://${LanIp}:3001"

Update-File `
  -Path (Join-Path $baseDir 'fronted\.env.local') `
  -Pattern 'NEXT_PUBLIC_WS_URL=https?://[^\r\n]*' `
  -Replacement "NEXT_PUBLIC_WS_URL=http://${LanIp}:3001"

# backend/.env: CORS permite el origen del frontend en la IP LAN
Update-File `
  -Path (Join-Path $baseDir 'backend\.env') `
  -Pattern 'FRONTEND_URL="https?://[^"]*"' `
  -Replacement "FRONTEND_URL=""http://${LanIp}:3000"""