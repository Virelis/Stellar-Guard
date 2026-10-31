<#
.SYNOPSIS
    Stellar-Guard Workspace Automation Task Runner for Windows.
.DESCRIPTION
    Provides unified command orchestration for building contracts, running test suites,
    linting monorepo workspaces, and launching local development environments.
.PARAMETER Task
    The task to execute: build, test, lint, format, seed, clean, or help.
#>

param (
    [Parameter(Position=0)]
    [ValidateSet("build", "test", "lint", "format", "clean", "help")]
    [string]$Task = "help"
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) {
    Write-Host "[INFO] $msg" -ForegroundColor Cyan
}

function Write-Success($msg) {
    Write-Host "[SUCCESS] $msg" -ForegroundColor Green
}

function Write-ErrorMsg($msg) {
    Write-Host "[ERROR] $msg" -ForegroundColor Red
}

$RootDir = Resolve-Path "$PSScriptRoot\.."

switch ($Task) {
    "build" {
        Write-Info "Building Soroban smart contracts..."
        cargo build --manifest-path "$RootDir\Cargo.toml" --release --target wasm32-unknown-unknown
        
        Write-Info "Building shared packages..."
        npm run build --workspace=@stellar-guard/types
        
        Write-Info "Compiling Backend TypeScript..."
        Push-Location "$RootDir\backend"
        npx tsc --noEmit
        Pop-Location
        
        Write-Info "Building Frontend..."
        Push-Location "$RootDir\frontend"
        npm run build
        Pop-Location
        
        Write-Success "All workspaces built successfully."
    }

    "test" {
        Write-Info "Executing Soroban contract tests..."
        cargo test --manifest-path "$RootDir\Cargo.toml"
        
        Write-Info "Executing Backend test suite..."
        Push-Location "$RootDir\backend"
        npm test
        Pop-Location
        
        Write-Info "Executing Frontend test suite..."
        Push-Location "$RootDir\frontend"
        npm test
        Pop-Location
        
        Write-Success "All test suites passed cleanly."
    }

    "lint" {
        Write-Info "Checking Rust formatting and clippy..."
        cargo fmt --manifest-path "$RootDir\Cargo.toml" --all -- --check
        cargo clippy --manifest-path "$RootDir\Cargo.toml" --all-targets -- -D warnings
        
        Write-Info "Checking code format..."
        npx prettier --check "packages/**/*.{ts,json}" "backend/src/**/*.{ts,json}" "frontend/src/**/*.{ts,tsx,json}"
        Write-Success "Lint verification passed."
    }

    "format" {
        Write-Info "Formatting Rust code..."
        cargo fmt --manifest-path "$RootDir\Cargo.toml" --all
        
        Write-Info "Formatting TypeScript and JSON..."
        npx prettier --write "packages/**/*.{ts,json}" "backend/src/**/*.{ts,json}" "frontend/src/**/*.{ts,tsx,json}"
        Write-Success "All code formatted."
    }

    "clean" {
        Write-Info "Cleaning build artifacts and cache..."
        cargo clean --manifest-path "$RootDir\Cargo.toml"
        Remove-Item -Recurse -Force "$RootDir\frontend\.next" -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force "$RootDir\backend\dist" -ErrorAction SilentlyContinue
        Remove-Item -Recurse -Force "$RootDir\packages\types\dist" -ErrorAction SilentlyContinue
        Write-Success "Workspace cleaned."
    }

    default {
        Write-Host "Stellar-Guard Workspace Task Runner" -ForegroundColor Yellow
        Write-Host "Usage: .\scripts\task-runner.ps1 [build | test | lint | format | clean]"
    }
}

