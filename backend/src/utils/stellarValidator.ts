import * as StellarSdk from "@stellar/stellar-sdk";

export function isValidEd25519PublicKey(address: string): boolean {
  if (!address || typeof address !== "string") return false;
  try {
    return StellarSdk.StrKey.isValidEd25519PublicKey(address);
  } catch {
    return false;
  }
}

export function isValidContractId(contractId: string): boolean {
  if (!contractId || typeof contractId !== "string") return false;
  try {
    return (StellarSdk.StrKey as any).isValidContract(contractId);
  } catch {
    return false;
  }
}

export function isValidStellarAddress(address: string): boolean {
  return isValidEd25519PublicKey(address) || isValidContractId(address);
}

export function isValidAssetCode(assetCode: string): boolean {
  if (!assetCode || typeof assetCode !== "string") return false;
  if (assetCode === "XLM" || assetCode === "native") return true;
  return /^[a-zA-Z0-9]{1,12}$/.test(assetCode);
}

export function validateFreezeRequest(payload: {
  assetCode?: unknown;
  issuer?: unknown;
  target?: unknown;
}): { valid: boolean; error?: string } {
  if (!payload.assetCode || typeof payload.assetCode !== "string" || !isValidAssetCode(payload.assetCode)) {
    return { valid: false, error: "Invalid asset code (must be 1-12 alphanumeric characters or XLM)" };
  }

  if (!payload.issuer || typeof payload.issuer !== "string" || !isValidStellarAddress(payload.issuer)) {
    return { valid: false, error: "Invalid issuer address format" };
  }

  if (!payload.target || typeof payload.target !== "string" || !isValidStellarAddress(payload.target)) {
    return { valid: false, error: "Invalid target address format" };
  }

  if (payload.target === payload.issuer) {
    return { valid: false, error: "Target address cannot be identical to issuer account (self-freeze prohibited)" };
  }

  return { valid: true };
}
