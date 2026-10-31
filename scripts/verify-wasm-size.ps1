<#
.SYNOPSIS
    Soroban WASM Bytecode Size Verifier for Windows.
.DESCRIPTION
    Validates that compiled Soroban smart contract WASM binaries comply with Stellar ledger size constraints
    (strictly under 64KB / 65,536 bytes) to prevent deployment failures.
#>

$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path "$PSScriptRoot\.."
$WasmDir = "$RootDir\target\wasm32-unknown-unknown\release"

Write-Host "Checking Soroban WASM release bytecode sizes..." -ForegroundColor Cyan

if (-not (Test-Path $WasmDir)) {
    Write-Host "Target directory not found. Compiling WASM first..." -ForegroundColor Yellow
    cargo build --manifest-path "$RootDir\Cargo.toml" --release --target wasm32-unknown-unknown
}

$WasmFiles = Get-ChildItem -Path $WasmDir -Filter "*.wasm"

if ($WasmFiles.Count -eq 0) {
    Write-Error "No .wasm files found in $WasmDir"
    exit 1
}

$MaxSizeBytes = 65536 # 64 KB Soroban ledger limit
$AnyExceeded = $false

foreach ($file in $WasmFiles) {
    $size = $file.Length
    $sizeKb = [Math]::Round($size / 1024, 2)
    
    if ($size -le $MaxSizeBytes) {
        Write-Host " [PASS] $($file.Name): $size bytes ($sizeKb KB) - within 64KB limit" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] $($file.Name): $size bytes ($sizeKb KB) - EXCEEDS 64KB limit!" -ForegroundColor Red
        $AnyExceeded = $true
    }
}

if ($AnyExceeded) {
    Write-Error "One or more WASM contracts exceed the Stellar 64KB size limit."
    exit 1
}

Write-Host "All WASM binaries passed size verification." -ForegroundColor Green
