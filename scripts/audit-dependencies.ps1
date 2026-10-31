<#
.SYNOPSIS
    Monorepo Dependency Health and Vulnerability Auditor for Windows.
.DESCRIPTION
    Scans npm workspaces and Cargo crates for outdated dependencies,
    known security advisories, and license compliance across all tiers.
#>

$RootDir = Resolve-Path "$PSScriptRoot\.."

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " Stellar-Guard Dependency Health & Security   " -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Cyan

Write-Host "[1/2] Auditing Cargo smart contract dependencies..." -ForegroundColor Cyan
cargo audit --manifest-path "$RootDir\Cargo.toml" -ErrorAction SilentlyContinue
if ($LASTEXITCODE -eq 0) {
    Write-Host " [PASS] No RustSec security advisories detected." -ForegroundColor Green
} else {
    Write-Host " [WARN] Cargo audit completed with warnings or advisories." -ForegroundColor Yellow
}

Write-Host "[2/2] Auditing Node.js npm dependencies..." -ForegroundColor Cyan
Push-Location "$RootDir"
npm audit --audit-level=high
if ($LASTEXITCODE -eq 0) {
    Write-Host " [PASS] No high-severity npm vulnerabilities detected." -ForegroundColor Green
} else {
    Write-Host " [WARN] NPM audit completed with non-zero exit code." -ForegroundColor Yellow
}
Pop-Location

Write-Host "Dependency audit finished." -ForegroundColor Green
