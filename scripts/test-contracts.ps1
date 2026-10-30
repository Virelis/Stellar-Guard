# scripts/test-contracts.ps1 - Automated Soroban contract test runner
$ErrorActionPreference = "Stop"

Write-Host "Running Stellar Guard Soroban smart contract test suite..." -ForegroundColor Cyan

# Windows Soroban snapshots require single-threaded execution to prevent file locks
cargo test -- --test-threads=1

if ($LASTEXITCODE -eq 0) {
    Write-Host "All contract unit and integration tests passed successfully!" -ForegroundColor Green
} else {
    Write-Error "Contract tests failed with exit code $LASTEXITCODE"
}
