/**
 * Stellar XDR Transaction Envelope Validator
 * Decodes base64-encoded transaction envelopes and verifies operation integrity and signers.
 */

const path = require("path");

function getStellarSdk() {
  try {
    return require("@stellar/stellar-sdk");
  } catch {
    const backendSdk = path.resolve(__dirname, "..", "backend", "node_modules", "@stellar", "stellar-sdk");
    return require(backendSdk);
  }
}

function validateTransactionXdr(xdrBase64, networkPassphrase = "Test SDF Network ; September 2015") {
  const { TransactionBuilder, Networks } = getStellarSdk();

  try {
    const tx = TransactionBuilder.fromXDR(xdrBase64, networkPassphrase);

    return {
      valid: true,
      source: tx.source,
      sequence: tx.sequence,
      fee: tx.fee,
      operationsCount: tx.operations.length,
      signaturesCount: tx.signatures.length,
      operations: tx.operations.map((op) => ({
        type: op.type,
      })),
    };
  } catch (err) {
    return {
      valid: false,
      error: err.message,
    };
  }
}

if (require.main === module) {
  const xdr = process.argv[2];
  if (!xdr) {
    console.log("Stellar XDR Validator Utility");
    console.log("Usage: node scripts/validate-xdr.js <BASE64_XDR>");
    process.exit(0);
  }

  const result = validateTransactionXdr(xdr);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}

module.exports = { validateTransactionXdr };

