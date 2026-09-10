[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw 'Git is required for the tracked-file security check.'
}

$trackedFiles = @(git ls-files)
if ($LASTEXITCODE -ne 0) {
    throw 'Unable to list tracked files.'
}

$trackedEnvironmentFiles = @(
    $trackedFiles | Where-Object {
        ($_ -eq '.env' -or $_ -like '.env.*') -and $_ -ne '.env.example'
    }
)
if ($trackedEnvironmentFiles.Count -gt 0) {
    throw "Tracked environment file(s) found: $($trackedEnvironmentFiles -join ', ')"
}

$secretPattern = '(?i)(-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_-]?key|secret|token)\s*[:=]\s*["'']?[A-Za-z0-9_+\-/=]{16,})'
$findings = @()
foreach ($path in $trackedFiles) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        continue
    }
    $matches = Select-String -LiteralPath $path -Pattern $secretPattern -ErrorAction SilentlyContinue
    foreach ($match in $matches) {
        $findings += "$path`:$($match.LineNumber)"
    }
}

if ($findings.Count -gt 0) {
    throw "Possible committed secret(s) found at: $($findings -join ', ')"
}

Write-Host 'PASS no tracked local environment files'
Write-Host 'PASS no private-key or high-confidence token patterns found'
Write-Host 'Manual review is still required for access control, CORS, dependency risk and deployment secrets.'
