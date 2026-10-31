<#
.SYNOPSIS
    Stellar-Guard Transient Storage & Cache Pruning Script for Windows.
.DESCRIPTION
    Safely purges transient development artifacts, SQLite test databases,
    Next.js cache directories, and Soroban compilation build caches without touching source code.
#>

$RootDir = Resolve-Path "$PSScriptRoot\.."

Write-Host "Purging transient development storage and caches..." -ForegroundColor Cyan

$Targets = @(
    "$RootDir\backend\*.db",
    "$RootDir\backend\*.db-journal",
    "$RootDir\backend\*.db-wal",
    "$RootDir\backend\*.db-shm",
    "$RootDir\frontend\.next",
    "$RootDir\coverage",
    "$RootDir\*.tsbuildinfo",
    "$RootDir\backend\*.tsbuildinfo",
    "$RootDir\frontend\*.tsbuildinfo",
    "$RootDir\mock-compliance-dataset.json"
)

$RemovedCount = 0

foreach ($pattern in $Targets) {
    if (Test-Path $pattern) {
        Remove-Item -Path $pattern -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host " [REMOVED] $pattern" -ForegroundColor Yellow
        $RemovedCount++
    }
}

Write-Host "Storage purge completed. Cleaned $RemovedCount path(s)." -ForegroundColor Green

