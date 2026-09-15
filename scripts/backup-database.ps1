[CmdletBinding()]
param([string]$OutputPath)
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot
$python = Join-Path $repoRoot '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) { throw 'Create the project virtual environment first.' }
$arguments = @('scripts/backup_database.py')
if ($OutputPath) { $arguments += $OutputPath }
& $python @arguments
if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL backup failed.' }
