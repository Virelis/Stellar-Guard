import axios from "axios";
import { logger } from "./logger";

const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const CONTRACT_ID = process.env.FREEZE_CONTRACT_ID ?? "";
const NETWORK_PASSPHRASE =
  process.env.NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

// Short-TTL simulation cache to prevent redundant RPC roundtrips
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry<any>>();

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.value;
  }
  return null;
}

function setInCache<T>(key: string, value: T, ttlMs = 5000): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export async function checkSorobanRpcHealth(): Promise<{
  status: "ok" | "unreachable";
  latestLedger?: number;
  rpcUrl: string;
}> {
  try {
    const { data } = await axios.post(
      RPC_URL,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "getLatestLedger",
      },
      { timeout: 5000 }
    );
    if (data?.result?.sequence) {
      return { status: "ok", latestLedger: data.result.sequence, rpcUrl: RPC_URL };
    }
    return { status: "unreachable", rpcUrl: RPC_URL };
  } catch (err: any) {
    logger.warn(`[SorobanRPC] Health probe failed: ${err.message}`);
    return { status: "unreachable", rpcUrl: RPC_URL };
  }
}

/**
 * Query on-chain vote count for a proposal via Soroban RPC simulateTransaction.
 */
export async function getOnChainVotes(
  assetCode: string,
  target: string
): Promise<number | null> {
  if (!CONTRACT_ID) return null;
  const cacheKey = `votes:${assetCode}:${target}`;
  const cached = getFromCache<number>(cacheKey);
  if (cached !== null) return cached;

  try {
    const StellarSdk = await import("@stellar/stellar-sdk");
    const contract = new StellarSdk.Contract(CONTRACT_ID);

    const dummyAccount = new StellarSdk.Account(
      "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
      "0"
    );

    const tx = new StellarSdk.TransactionBuilder(dummyAccount, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "get_votes",
          StellarSdk.xdr.ScVal.scvString(assetCode),
          StellarSdk.Address.fromString(target).toScVal()
        )
      )
      .setTimeout(30)
      .build();

    const { data } = await axios.post(
      RPC_URL,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "simulateTransaction",
        params: { transaction: tx.toXDR() },
      },
      { timeout: 8000 }
    );

    if (data?.result?.results?.[0]?.xdr) {
      const scVal = StellarSdk.xdr.ScVal.fromXDR(
        data.result.results[0].xdr,
        "base64"
      );
      const val = StellarSdk.scValToNative(scVal) as number;
      setInCache(cacheKey, val);
      return val;
    }
    return null;
  } catch (err: any) {
    logger.debug(`[SorobanRPC] getOnChainVotes simulation error: ${err.message}`);
    return null;
  }
}

/**
 * Query whether an account is frozen on-chain for the given asset.
 */
export async function isAccountFrozenOnChain(
  assetCode: string,
  target: string
): Promise<boolean | null> {
  if (!CONTRACT_ID) return null;
  const cacheKey = `frozen:${assetCode}:${target}`;
  const cached = getFromCache<boolean>(cacheKey);
  if (cached !== null) return cached;

  try {
    const StellarSdk = await import("@stellar/stellar-sdk");
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const dummyAccount = new StellarSdk.Account(
      "GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN",
      "0"
    );

    const tx = new StellarSdk.TransactionBuilder(dummyAccount, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "is_account_frozen",
          StellarSdk.xdr.ScVal.scvString(assetCode),
          StellarSdk.Address.fromString(target).toScVal()
        )
      )
      .setTimeout(30)
      .build();

    const { data } = await axios.post(
      RPC_URL,
      {
        jsonrpc: "2.0",
        id: 1,
        method: "simulateTransaction",
        params: { transaction: tx.toXDR() },
      },
      { timeout: 8000 }
    );

    if (data?.result?.results?.[0]?.xdr) {
      const scVal = StellarSdk.xdr.ScVal.fromXDR(
        data.result.results[0].xdr,
        "base64"
      );
      const isFrozen = Boolean(StellarSdk.scValToNative(scVal));
      setInCache(cacheKey, isFrozen);
      return isFrozen;
    }
    return null;
  } catch (err: any) {
    logger.debug(`[SorobanRPC] isAccountFrozenOnChain error: ${err.message}`);
    return null;
  }
}
