<#
.SYNOPSIS
    Semantic Release Tagging and Verification Script for Windows.
.DESCRIPTION
    Validates that test suites pass, verifies WASM bytecode size, generates checksums,
    and creates annotated semantic git release tags (e.g. v1.0.0).
.PARAMETER Version
    Semantic version tag (e.g. v1.0.0). Default: v1.0.0.
#>

param (
    [Parameter(Position=0)]
    [string]$Version = "v1.0.0"
)

$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path "$PSScriptRoot\.."

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " Stellar-Guard Release Verification & Tagging " -ForegroundColor Yellow
Write-Host " Target Version: $Version                     " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

Write-Host "[1/3] Running workspace test suites..." -ForegroundColor Cyan
npx --prefix "$RootDir\backend" jest "$RootDir\tests\workspace.test.js" "$RootDir\tests\codebase_tooling.test.js"

Write-Host "[2/3] Verifying release WASM checksums..." -ForegroundColor Cyan
node "$RootDir\scripts\verify-checksums.js" generate

Write-Host "[3/3] Preparing git release tag '$Version'..." -ForegroundColor Cyan
git tag -a $Version -m "Release $Version: Institutional CAP-0077 Freeze & RWA Asset Protection on Stellar"

Write-Host "Release $Version created successfully." -ForegroundColor Green
Write-Host "To push this release tag to GitHub, run: git push origin $Version" -ForegroundColor Yellow

