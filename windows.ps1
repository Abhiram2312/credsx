$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

function Require-Cmd([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Write-Host "Missing '$Name'. Install it, then run windows.bat again."
    exit 1
  }
}

Require-Cmd podman
Require-Cmd uv
Require-Cmd npm

Write-Host "Checking Podman..."
podman info *> $null
if ($LASTEXITCODE -ne 0) {
  podman machine start
  if ($LASTEXITCODE -ne 0) {
    podman machine init
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    podman machine start
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
}

Write-Host "Starting Postgres..."
podman compose up -d
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Waiting for Postgres..."
$ready = $false
for ($i = 0; $i -lt 40; $i++) {
  podman compose exec -T db pg_isready -U cards -d cards *> $null
  if ($LASTEXITCODE -eq 0) {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 1
}
if (-not $ready) {
  Write-Host "Postgres did not become ready."
  exit 1
}

Write-Host "Installing API dependencies..."
Push-Location "$root\api"
uv sync
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Pop-Location

Write-Host "Installing web dependencies..."
Push-Location "$root\web"
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Pop-Location

Write-Host "Starting the API on http://127.0.0.1:8000"
$api = Start-Process -FilePath "uv" -ArgumentList @("run", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") -WorkingDirectory "$root\api" -PassThru -NoNewWindow

try {
  Start-Sleep -Seconds 1
  if ($api.HasExited) {
    Write-Host "The API stopped. Port 8000 may already be in use."
    exit 1
  }
  Write-Host "Starting the site on http://127.0.0.1:5173"
  Set-Location "$root\web"
  npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
} finally {
  if ($api -and -not $api.HasExited) {
    taskkill /PID $api.Id /T /F *> $null
  }
}
