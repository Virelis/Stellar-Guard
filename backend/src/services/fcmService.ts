import axios from "axios";
import { logger } from "./logger";

const FCM_SERVER_KEY = process.env.FCM_SERVER_KEY ?? "";
const FCM_TOPIC = process.env.FCM_TOPIC ?? "freeze_alerts";

// In-memory token registry for administrator mobile devices
const deviceTokens = new Set<string>();

export function registerDeviceToken(token: string): boolean {
  if (!token || typeof token !== "string" || token.trim().length === 0) return false;
  deviceTokens.add(token.trim());
  return true;
}

export function unregisterDeviceToken(token: string): boolean {
  return deviceTokens.delete(token.trim());
}

export function getRegisteredDeviceCount(): number {
  return deviceTokens.size;
}

async function sendFcmPayload(payload: Record<string, unknown>): Promise<boolean> {
  if (!FCM_SERVER_KEY) {
    logger.debug("[FCM] Server key not configured; skipping push notification");
    return false;
  }

  try {
    await axios.post("https://fcm.googleapis.com/fcm/send", payload, {
      headers: {
        Authorization: `key=${FCM_SERVER_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });
    return true;
  } catch (err: any) {
    logger.warn(`[FCM] Notification dispatch failed: ${err.message}`);
    return false;
  }
}

export async function sendFreezeProposalNotification(
  assetCode: string,
  target: string,
  proposer?: string
): Promise<void> {
  const shortTarget = `${target.slice(0, 8)}...${target.slice(-4)}`;
  const body = proposer
    ? `Proposer: ${proposer.slice(0, 8)}... | Asset: ${assetCode} | Target: ${shortTarget}`
    : `Asset: ${assetCode} — Target: ${shortTarget}`;

  // 1. Send to public/governance topic
  await sendFcmPayload({
    to: `/topics/${FCM_TOPIC}`,
    notification: {
      title: "⚡ Stellar-Guard: New Freeze Proposal",
      body,
    },
    data: { assetCode, target, type: "NEW_PROPOSAL", timestamp: new Date().toISOString() },
  });

  // 2. Multicast to registered admin devices (in batches of 500)
  if (deviceTokens.size > 0) {
    const tokens = Array.from(deviceTokens);
    for (let i = 0; i < tokens.length; i += 500) {
      const batch = tokens.slice(i, i + 500);
      await sendFcmPayload({
        registration_ids: batch,
        notification: {
          title: "⚡ Action Required: Governance Proposal",
          body,
        },
        data: { assetCode, target, type: "NEW_PROPOSAL" },
      });
    }
  }
}

export async function sendQuorumReachedNotification(
  assetCode: string,
  target: string,
  votes: number
): Promise<void> {
  const shortTarget = `${target.slice(0, 8)}...${target.slice(-4)}`;
  await sendFcmPayload({
    to: `/topics/${FCM_TOPIC}`,
    notification: {
      title: "🛡️ Quorum Reached — Freeze Executed",
      body: `Quorum reached with ${votes} votes. Account ${shortTarget} quarantined for ${assetCode}.`,
    },
    data: { assetCode, target, votes: String(votes), type: "QUORUM_EXECUTED" },
  });
}
