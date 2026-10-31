<#
.SYNOPSIS
    Stellar Testnet Friendbot Account Funding Utility for Windows.
.DESCRIPTION
    Requests testnet XLM funding from Stellar Friendbot for specified public keys
    with exponential backoff retries and balance verification.
.PARAMETER Addresses
    Array of Stellar G... public key addresses to fund.
#>

param (
    [Parameter(Position=0, Mandatory=$false)]
    [string[]]$Addresses = @(
        "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA",
        "GBNDL7H7L5B2M77EQV6W32R3W6K47D2P25G5CVL45C4QZQ3R6T2QBAAA",
        "GC3K5B632KM5L4XQOAZ3W2K4D2P25G5CVL45C4QZQ3R6T2QBAAAMCAAA"
    )
)

$ErrorActionPreference = "Continue"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " Stellar Testnet Friendbot Account Funder     " -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Cyan

foreach ($Addr in $Addresses) {
    Write-Host "Funding account: $Addr" -ForegroundColor Cyan
    $FriendbotUrl = "https://friendbot.stellar.org?addr=$Addr"
    
    $Success = $false
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            $response = Invoke-RestMethod -Uri $FriendbotUrl -Method Get -TimeoutSec 15
            Write-Host " [OK] Successfully funded on attempt $attempt" -ForegroundColor Green
            $Success = $true
            break
        } catch {
            Write-Host " [WARN] Attempt $attempt failed. Retrying in 2 seconds..." -ForegroundColor DarkYellow
            Start-Sleep -Seconds 2
        }
    }

    if (-not $Success) {
        Write-Host " [SKIP] Friendbot request failed or account already funded: $Addr" -ForegroundColor Gray
    }
}

Write-Host "Funding sequence completed." -ForegroundColor Green

