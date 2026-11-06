import axios from "axios";
import crypto from "crypto";
import { listWebhooks, signWebhookPayload, WebhookSubscription } from "./webhookService";
import { logger } from "./logger";
import { eventBus, GovernanceEvent } from "./eventBus";
import { isSafeWebhookUrl } from "../utils/ssrfValidator";

export interface DeliveryAttempt {
  id: string;
  webhookId: number;
  url: string;
  eventType: string;
  attempt: number;
  success: boolean;
  statusCode?: number;
  error?: string;
  timestamp: string;
}

const deadLetterQueue: DeliveryAttempt[] = [];

export function getDeadLetterQueue(): DeliveryAttempt[] {
  return [...deadLetterQueue];
}

export function clearDeadLetterQueue(): void {
  deadLetterQueue.length = 0;
}

export async function dispatchToWebhook(
  hook: WebhookSubscription,
  event: GovernanceEvent,
  maxRetries = 3
): Promise<boolean> {
  const urlCheck = isSafeWebhookUrl(hook.url);
  if (!urlCheck.valid) {
    logger.warn(
      `[WebhookDispatcher] Blocked SSRF attempt for webhook #${hook.id} (${hook.url}): ${urlCheck.reason}`
    );
    return false;
  }

  const deliveryId = crypto.randomUUID();
  const payloadStr = JSON.stringify(event);
  const signature = signWebhookPayload(payloadStr, hook.secret);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(hook.url, payloadStr, {
        headers: {
          "Content-Type": "application/json",
          "X-StellarGuard-Event": event.type,
          "X-StellarGuard-Signature": signature,
          "X-StellarGuard-Delivery": deliveryId,
          "User-Agent": "Stellar-Guard-Webhook-Dispatcher/1.0",
        },
        timeout: 5000,
      });

      if (response.status >= 200 && response.status < 300) {
        logger.debug(`[WebhookDispatcher] Delivered ${event.type} to #${hook.id} (${hook.url})`);
        return true;
      }
    } catch (err: any) {
      const status = err.response?.status;
      logger.warn(
        `[WebhookDispatcher] Attempt ${attempt}/${maxRetries} failed for #${hook.id} (${hook.url}): ${err.message}`
      );

      if (attempt === maxRetries) {
        deadLetterQueue.push({
          id: deliveryId,
          webhookId: hook.id,
          url: hook.url,
          eventType: event.type,
          attempt,
          success: false,
          statusCode: status,
          error: err.message,
          timestamp: new Date().toISOString(),
        });
        if (deadLetterQueue.length > 500) deadLetterQueue.shift();
      } else {
        // Backoff delay before retry: 250ms, 500ms...
        await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt - 1)));
      }
    }
  }

  return false;
}

export async function dispatchGovernanceEvent(event: GovernanceEvent): Promise<number> {
  if (event.type === "HEARTBEAT") return 0;

  const hooks = listWebhooks();
  let dispatched = 0;

  for (const hook of hooks) {
    if (hook.eventFilter === "*" || hook.eventFilter === event.type) {
      dispatchToWebhook(hook, event).catch(() => {});
      dispatched++;
    }
  }

  return dispatched;
}

// Hook into eventBus so every broadcast automatically dispatches to webhooks
const originalBroadcast = eventBus.broadcast.bind(eventBus);
eventBus.broadcast = (type: GovernanceEvent["type"], data: Record<string, unknown>) => {
  originalBroadcast(type, data);
  if (type !== "HEARTBEAT") {
    dispatchGovernanceEvent({
      type,
      timestamp: new Date().toISOString(),
      data,
    }).catch(() => {});
  }
};
