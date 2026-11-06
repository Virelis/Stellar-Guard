import { Router, Request, Response } from "express";
import {
  formatDiscordAlert,
  formatSlackAlert,
  AlertNotificationData,
} from "../services/notificationTemplates";
import { logger } from "../services/logger";

export const integrationsRouter = Router();

// Test or validate Discord webhook format
integrationsRouter.post("/discord/format", (req: Request, res: Response) => {
  const data = req.body as AlertNotificationData;
  if (!data.assetCode || !data.targetAddress || !data.eventType) {
    return res
      .status(400)
      .json({ error: "Missing required fields: assetCode, targetAddress, eventType" });
  }

  const payload = formatDiscordAlert(data);
  return res.json({ success: true, payload });
});

// Test or validate Slack webhook format
integrationsRouter.post("/slack/format", (req: Request, res: Response) => {
  const data = req.body as AlertNotificationData;
  if (!data.assetCode || !data.targetAddress || !data.eventType) {
    return res
      .status(400)
      .json({ error: "Missing required fields: assetCode, targetAddress, eventType" });
  }

  const payload = formatSlackAlert(data);
  return res.json({ success: true, payload });
});

// Dispatch live notification to external webhook
integrationsRouter.post("/dispatch", async (req: Request, res: Response) => {
  const { provider, webhookUrl, data } = req.body as {
    provider: "discord" | "slack";
    webhookUrl: string;
    data: AlertNotificationData;
  };

  if (!provider || !webhookUrl || !data) {
    return res.status(400).json({ error: "Missing provider, webhookUrl, or data payload" });
  }

  let body: any;
  if (provider === "discord") {
    body = formatDiscordAlert(data);
  } else if (provider === "slack") {
    body = formatSlackAlert(data);
  } else {
    return res.status(400).json({ error: "Unsupported provider. Must be 'discord' or 'slack'" });
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const ok = response.ok;
    const status = response.status;
    logger.info("External integration alert dispatched", { provider, status, ok });

    return res.json({
      success: ok,
      status,
      provider,
    });
  } catch (err: any) {
    logger.error("Failed to dispatch external integration alert", {
      provider,
      error: err?.message,
    });
    return res.status(502).json({
      success: false,
      error: "DispatchFailed",
      message: err?.message,
    });
  }
});
