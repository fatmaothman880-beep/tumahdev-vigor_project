[CmdletBinding()]
param(
    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI was not found. Install/start Docker Desktop and reopen the terminal.'
}

if (-not $OutputPath) {
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $OutputPath = Join-Path $repoRoot "artifacts\backups\smart-port-$stamp.sql"
}

$dump = @(docker compose exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges')
if ($LASTEXITCODE -ne 0) {
    throw 'PostgreSQL backup failed.'
}
if ($dump.Count -eq 0) {
    throw 'PostgreSQL backup produced no output.'
}

$resolvedOutput = [IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Parent $resolvedOutput
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
[IO.File]::WriteAllLines($resolvedOutput, [string[]]$dump, [Text.UTF8Encoding]::new($false))

Write-Output $resolvedOutput
