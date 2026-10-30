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
