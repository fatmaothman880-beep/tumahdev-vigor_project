[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$VisitId,

    [string]$ApiBaseUrl = $(
        if ($env:API_BASE_URL) { $env:API_BASE_URL } else { 'http://localhost:8000' }
    ),

    [string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot

if (-not $OutputPath) {
    $OutputPath = Join-Path $repoRoot "artifacts\vessel-report-$VisitId.json"
}

$uri = "$($ApiBaseUrl.TrimEnd('/'))/reports/vessel/$([uri]::EscapeDataString($VisitId))"
$report = Invoke-RestMethod -Method Get -Uri $uri -TimeoutSec 15 -Headers @{ Accept = 'application/json' }

if (-not $report.visit_id) {
    throw 'Report response does not contain visit_id.'
}
if ([string]$report.visit_id -ne $VisitId) {
    throw "Report visit_id '$($report.visit_id)' does not match requested visit '$VisitId'."
}

$resolvedOutput = [IO.Path]::GetFullPath($OutputPath)
$outputDirectory = Split-Path -Parent $resolvedOutput
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
$report | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $resolvedOutput -Encoding UTF8

Write-Output $resolvedOutput
