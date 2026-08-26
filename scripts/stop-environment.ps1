[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI was not found. Install/start Docker Desktop and reopen the terminal.'
}

docker compose down
if ($LASTEXITCODE -ne 0) {
    throw 'Docker Compose could not stop the environment cleanly.'
}
