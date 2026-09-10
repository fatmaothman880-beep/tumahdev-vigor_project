[CmdletBinding()]
param(
    [string]$ApiBaseUrl = $(
        if ($env:API_BASE_URL) { $env:API_BASE_URL } else { 'http://localhost:8000/api/v1' }
    ),
    [string]$FrontendUrl = $(if ($env:FRONTEND_URL) { $env:FRONTEND_URL } else { 'http://localhost:3000' })
)

$ErrorActionPreference = 'Stop'
$healthUri = "$($ApiBaseUrl.TrimEnd('/'))/health"
$health = Invoke-RestMethod -Method Get -Uri $healthUri -TimeoutSec 10 -Headers @{ Accept = 'application/json' }

if ($health.status -ne 'healthy') {
    throw "API health check returned unexpected status '$($health.status)'."
}
Write-Host "PASS API health: $healthUri"

if ($FrontendUrl) {
    $response = Invoke-WebRequest -UseBasicParsing -Method Get -Uri $FrontendUrl -TimeoutSec 10
    if ($response.StatusCode -ne 200) {
        throw "Frontend smoke check returned HTTP $($response.StatusCode)."
    }
    Write-Host "PASS frontend availability: $FrontendUrl"
}
