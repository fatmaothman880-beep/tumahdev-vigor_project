[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$stateFile = Join-Path $repoRoot 'artifacts\local-processes.json'
if (-not (Test-Path -LiteralPath $stateFile)) { Write-Host 'No application processes recorded by the local launcher.'; return }
$entries = Get-Content -LiteralPath $stateFile -Raw | ConvertFrom-Json
foreach ($entry in $entries) {
    $process = Get-Process -Id $entry.id -ErrorAction SilentlyContinue
    # Refuse to stop an unrelated process that has reused an old process ID.
    if ($process -and $process.StartTime.ToUniversalTime().ToString('o') -eq $entry.started) { taskkill /PID $entry.id /T /F | Out-Null; if ($LASTEXITCODE -ne 0) { throw 'Unable to stop an application process tree.' } }
}
Remove-Item -LiteralPath $stateFile
Write-Host 'Application services stopped. The PostgreSQL service and data are unchanged.'
