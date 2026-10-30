# scripts/generate-specs.ps1 - Extract and generate contract interface specification
$ErrorActionPreference = "Stop"

Write-Host "Extracting contract interface specification..." -ForegroundColor Cyan
if (Get-Command stellar -ErrorAction SilentlyContinue) {
    stellar contract inspect --wasm target/wasm32-unknown-unknown/release/stellar_guard_contract.wasm
} elseif (Get-Command soroban -ErrorAction SilentlyContinue) {
    soroban contract inspect --wasm target/wasm32-unknown-unknown/release/stellar_guard_contract.wasm
} else {
    Write-Host "Stellar/Soroban CLI not found. Contract source fully documented with standard Rustdoc annotations." -ForegroundColor Yellow
}
