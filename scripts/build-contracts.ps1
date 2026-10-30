# scripts/build-contracts.ps1 - Automated Soroban contract build and size audit
$ErrorActionPreference = "Stop"

Write-Host "Building Stellar Guard Soroban smart contract for wasm32-unknown-unknown..." -ForegroundColor Cyan
cargo build --target wasm32-unknown-unknown --release

$wasmPath = "target/wasm32-unknown-unknown/release/stellar_guard_contract.wasm"
if (Test-Path $wasmPath) {
    $bytes = (Get-Item $wasmPath).Length
    $kb = [math]::Round($bytes / 1024, 2)
    Write-Host "Success! Contract binary built at: $wasmPath ($kb KB / $bytes bytes)" -ForegroundColor Green
    if ($bytes -gt 65536) {
        Write-Host "Note: Binary exceeds 64 KB uncompressed, use soroban contract optimize for deployment." -ForegroundColor Yellow
    }
} else {
    Write-Error "WASM artifact not found at $wasmPath"
}
