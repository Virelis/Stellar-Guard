import * as StellarSdk from "@stellar/stellar-sdk";
import crypto from "crypto";
import { logger } from "./logger";

const SERVER_SIGNING_KEY =
  process.env.SERVER_SIGNING_KEY ??
  "SDN4D6H77KAZQ76S67VCEEQT6RFE3W7E4K2E2X3UG3J4KYYXUGZNYU6H"; // default dev secret seed
const HOME_DOMAIN = process.env.HOME_DOMAIN ?? "stellar-guard.local";
const NETWORK_PASSPHRASE =
  process.env.NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

let serverKeypair: StellarSdk.Keypair;

function getServerKeypair(): StellarSdk.Keypair {
  if (!serverKeypair) {
    try {
      serverKeypair = StellarSdk.Keypair.fromSecret(SERVER_SIGNING_KEY);
    } catch {
      // In development fallback, derive or generate random server keypair
      serverKeypair = StellarSdk.Keypair.random();
      logger.warn(
        `[SEP-10] Using ephemeral server keypair for WebAuth: ${serverKeypair.publicKey()}`
      );
    }
  }
  return serverKeypair;
}

export function getServerPublicKey(): string {
  return getServerKeypair().publicKey();
}

/**
 * Builds a SEP-0010 compliant cryptographic challenge transaction.
 */
export function buildChallengeTx(
  clientPublicKey: string,
  homeDomain = HOME_DOMAIN,
  timeoutSeconds = 300
): { transaction: string; networkPassphrase: string } {
  const server = getServerKeypair();
  const now = Math.floor(Date.now() / 1000);
  const minTime = now;
  const maxTime = now + timeoutSeconds;

  // Nonce data value for replay attack prevention
  const nonce = crypto.randomBytes(32).toString("hex");

  // Build account with sequence 0 as per SEP-0010 specification
  const sourceAccount = new StellarSdk.Account(server.publicKey(), "0");

  const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
    timebounds: {
      minTime,
      maxTime,
    },
  });

  // Root manageData operation for home domain authentication
  txBuilder.addOperation(
    StellarSdk.Operation.manageData({
      source: clientPublicKey,
      name: `${homeDomain} auth`,
      value: Buffer.from(nonce, "utf8"),
    })
  );

  const tx = txBuilder.build();
  tx.sign(server);

  return {
    transaction: tx.toXDR(),
    networkPassphrase: NETWORK_PASSPHRASE,
  };
}

/**
 * Validates a client-signed SEP-0010 challenge transaction envelope.
 */
export function verifyChallengeTx(signedXdr: string): {
  valid: boolean;
  clientPublicKey?: string;
  error?: string;
} {
  try {
    const tx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
    if (!(tx instanceof StellarSdk.Transaction)) {
      return { valid: false, error: "Fee bump transactions not supported for SEP-0010" };
    }

    const serverKeypair = getServerKeypair();
    const serverPublicKey = serverKeypair.publicKey();

    // 1. Source must be server public key
    if (tx.source !== serverPublicKey) {
      return { valid: false, error: "Invalid transaction source account" };
    }

    // 2. Sequence must be 0
    if (tx.sequence !== "0") {
      return { valid: false, error: "Challenge sequence must be 0" };
    }

    // 3. Time bounds check
    const now = Math.floor(Date.now() / 1000);
    if (!tx.timeBounds || now < parseInt(tx.timeBounds.minTime, 10) || now > parseInt(tx.timeBounds.maxTime, 10)) {
      return { valid: false, error: "Challenge transaction has expired" };
    }

    // 4. Client operation check
    const op = tx.operations[0];
    if (!op || op.type !== "manageData" || !op.source) {
      return { valid: false, error: "Missing client manageData authentication operation" };
    }
    const clientPublicKey = op.source;

    // 5. Verify client signature
    const clientKeypair = StellarSdk.Keypair.fromPublicKey(clientPublicKey);
    const txHash = tx.hash();

    let clientSigned = false;
    for (const sig of tx.signatures) {
      if (clientKeypair.verify(txHash, sig.signature())) {
        clientSigned = true;
        break;
      }
    }

    if (!clientSigned) {
      return { valid: false, error: "Missing valid cryptographic signature from client account" };
    }

    return { valid: true, clientPublicKey };
  } catch (err: any) {
    return { valid: false, error: err.message || "Failed to decode or verify challenge transaction" };
  }
}
