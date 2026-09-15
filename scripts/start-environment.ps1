[CmdletBinding()]
param([switch]$Seed, [int]$HealthTimeoutSeconds = 60)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot
$python = Join-Path $repoRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) { throw 'Create .venv and install requirements.txt first. See README.md.' }
if (-not (Test-Path -LiteralPath '.env')) { throw 'Create .env from .env.example and set DATABASE_URL first.' }
if (-not (Test-Path -LiteralPath 'node_modules\tsx')) { throw 'Run npm ci first.' }
$node = (Get-Command node -ErrorAction Stop).Source
# Read only non-secret settings; passwords and signing keys stay out of console output.
$configJson = & $python -c "import json; from dotenv import dotenv_values; c=dotenv_values('.env'); print(json.dumps({k:c.get(k) for k in ['PORT','BACKEND_PORT','VITE_USE_MOCK_API']}))"
if ($LASTEXITCODE -ne 0) { throw 'Unable to read .env.' }
$config = $configJson | ConvertFrom-Json
$frontPort = if ($config.PORT) { [int]$config.PORT } else { 3000 }
$backPort = if ($config.BACKEND_PORT) { [int]$config.BACKEND_PORT } else { 8000 }
foreach ($port in @($frontPort, $backPort)) {
    if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
        throw "Port $port is already in use. Stop the existing preview/service before starting."
    }
}
& $python scripts/local_database.py start
if ($LASTEXITCODE -ne 0) { throw 'Local PostgreSQL startup failed.' }
Push-Location backend
try {
    & $python -m alembic upgrade head
    if ($LASTEXITCODE -ne 0) { throw 'Migration failed. Check DATABASE_URL and the PostgreSQL service.' }
    if ($Seed) {
        & $python -m app.database.seed
        if ($LASTEXITCODE -ne 0) { throw 'Database seed failed.' }
    }
} finally { Pop-Location }
New-Item -ItemType Directory -Force -Path artifacts | Out-Null
$stateFile = Join-Path $repoRoot 'artifacts\local-processes.json'
$started = @()
try {
    $backend = Start-Process -FilePath $python -ArgumentList '-m','uvicorn','app.main:app','--host','127.0.0.1','--port',"$backPort" -WorkingDirectory (Join-Path $repoRoot 'backend') -WindowStyle Hidden -RedirectStandardOutput 'artifacts/backend.stdout.log' -RedirectStandardError 'artifacts/backend.stderr.log' -PassThru
    $started += @{ id = $backend.Id; started = $backend.StartTime.ToUniversalTime().ToString('o') }
    # Explicit settings prevent a previous demo shell from keeping mock mode enabled.
    $oldEnvironment = @{}
    foreach ($key in @('NODE_ENV','PORT','OPERATIONS_API_URL','VITE_API_URL','VITE_USE_MOCK_API','HOST')) { $oldEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
    try {
        $env:NODE_ENV = 'development'
        $env:HOST = '127.0.0.1'
        $env:PORT = "$frontPort"
        $env:OPERATIONS_API_URL = "http://127.0.0.1:$backPort/api/v1"
        $env:VITE_API_URL = '/api/v1'
        $env:VITE_USE_MOCK_API = 'false'
        $frontend = Start-Process -FilePath $node -ArgumentList '--import','tsx','server.ts' -WorkingDirectory $repoRoot -WindowStyle Hidden -RedirectStandardOutput 'artifacts/frontend.stdout.log' -RedirectStandardError 'artifacts/frontend.stderr.log' -PassThru
        $started += @{ id = $frontend.Id; started = $frontend.StartTime.ToUniversalTime().ToString('o') }
    } finally {
        foreach ($key in $oldEnvironment.Keys) { [Environment]::SetEnvironmentVariable($key, $oldEnvironment[$key], 'Process') }
    }
    $started | ConvertTo-Json | Set-Content -LiteralPath $stateFile
    $deadline = (Get-Date).AddSeconds($HealthTimeoutSeconds)
    do {
        foreach ($entry in $started) {
            if (-not (Get-Process -Id $entry.id -ErrorAction SilentlyContinue)) { throw 'A service exited. Check artifacts/*.stderr.log.' }
        }
        try {
            $health = Invoke-RestMethod "http://127.0.0.1:$frontPort/api/v1/health/database" -TimeoutSec 2
            $page = Invoke-WebRequest "http://127.0.0.1:$frontPort/" -UseBasicParsing -TimeoutSec 2
            if ($health.database -eq 'connected' -and $page.StatusCode -eq 200) {
                Write-Host "VIGOR is ready: http://localhost:$frontPort (PostgreSQL connected)"
                Write-Host 'Stop the application with scripts/stop-environment.ps1. PostgreSQL stays running.'
                return
            }
        } catch { }
        Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)
    throw 'Startup timed out. Inspect artifacts/backend.stderr.log and artifacts/frontend.stderr.log.'
} catch {
    foreach ($entry in $started) {
        $process = Get-Process -Id $entry.id -ErrorAction SilentlyContinue
        if ($process -and $process.StartTime.ToUniversalTime().ToString('o') -eq $entry.started) { taskkill /PID $entry.id /T /F | Out-Null }
    }
    Remove-Item -LiteralPath $stateFile -ErrorAction SilentlyContinue
    throw
}
