# Deploy freeze-governance contract across Stellar networks (Windows PowerShell)
param(
    [string]$Network = "testnet",
    [string]$Identity = "deployer",
    [string]$Admins = ""
)

$ErrorActionPreference = "Stop"

Write-Host "==> Target Network: $Network"
Write-Host "==> Identity: $Identity"

$wasmPath = "target/wasm32-unknown-unknown/release/stellar_guard_contract.wasm"
$optimizedPath = "target/wasm32-unknown-unknown/release/stellar_guard_contract.optimized.wasm"

Write-Host "==> Building contract WASM bytecode..."
cargo build --release --target wasm32-unknown-unknown

if (Get-Command stellar -ErrorAction SilentlyContinue) {
    Write-Host "==> Optimizing WASM binary with stellar CLI..."
    stellar contract optimize --wasm $wasmPath

    Write-Host "==> Deploying to $Network..."
    $contractId = stellar contract deploy --wasm $optimizedPath --source $Identity --network $Network
    Write-Host "Contract successfully deployed: $contractId"

    if ($Admins -ne "") {
        Write-Host "==> Initializing contract with admins: $Admins..."
        stellar contract invoke --id $contractId --source $Identity --network $Network -- init --admins $Admins
    }

    $envPath = "../../backend/.env"
    if (Test-Path $envPath) {
        Write-Host "==> Updating backend .env with FREEZE_CONTRACT_ID..."
        (Get-Content $envPath) -replace "^FREEZE_CONTRACT_ID=.*", "FREEZE_CONTRACT_ID=$contractId" | Set-Content $envPath
    }
} else {
    Write-Warning "Stellar CLI not found in PATH. Pre-compiled WASM built at $wasmPath"
}
