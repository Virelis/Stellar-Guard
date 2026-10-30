import * as StellarSdk from "@stellar/stellar-sdk";

export function verifyEd25519Signature(
  publicKey: string,
  data: Buffer | Uint8Array,
  signature: Buffer | Uint8Array
): boolean {
  try {
    const keypair = StellarSdk.Keypair.fromPublicKey(publicKey);
    return keypair.verify(Buffer.from(data), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function verifyTransactionSignature(
  tx: StellarSdk.Transaction | StellarSdk.FeeBumpTransaction,
  expectedSignerPublicKey: string
): boolean {
  try {
    const keypair = StellarSdk.Keypair.fromPublicKey(expectedSignerPublicKey);
    const txHash = tx.hash();

    // Check all attached signatures on the envelope
    for (const decoratedSig of tx.signatures) {
      const sigBytes = decoratedSig.signature();
      if (keypair.verify(txHash, sigBytes)) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

export function verifyAuthProof(
  publicKey: string,
  challengeMessage: string,
  signatureBase64: string
): boolean {
  try {
    const sigBuffer = Buffer.from(signatureBase64, "base64");
    const dataBuffer = Buffer.from(challengeMessage, "utf8");
    return verifyEd25519Signature(publicKey, dataBuffer, sigBuffer);
  } catch {
    return false;
  }
}
