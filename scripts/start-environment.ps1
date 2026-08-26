[CmdletBinding()]
param(
    [int]$HealthTimeoutSeconds = 60
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI was not found. Install/start Docker Desktop and reopen the terminal.'
}

docker info | Out-Null
if ($LASTEXITCODE -ne 0) {
    throw 'Docker Desktop is installed but its engine is not available.'
}

if (-not (Test-Path -LiteralPath '.env')) {
    Copy-Item -LiteralPath '.env.example' -Destination '.env'
    Write-Host 'Created local .env from .env.example.'
}

docker compose config --quiet
if ($LASTEXITCODE -ne 0) {
    throw 'Docker Compose configuration is invalid.'
}

docker compose up -d db
if ($LASTEXITCODE -ne 0) {
    throw 'Docker Compose could not start PostgreSQL.'
}

$containerId = docker compose ps -q db
if (-not $containerId) {
    throw 'PostgreSQL container was not created.'
}

$deadline = (Get-Date).AddSeconds($HealthTimeoutSeconds)
do {
    $health = docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' $containerId
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker could not inspect the PostgreSQL container.'
    }
    if ($health -eq 'healthy') {
        docker compose ps db
        Write-Host 'PostgreSQL is healthy.'
        exit 0
    }
    if ($health -eq 'exited' -or $health -eq 'dead') {
        docker compose logs db
        throw "PostgreSQL stopped before becoming healthy (state: $health)."
    }
    Start-Sleep -Seconds 2
} while ((Get-Date) -lt $deadline)

docker compose logs db
throw "PostgreSQL did not become healthy within $HealthTimeoutSeconds seconds."
