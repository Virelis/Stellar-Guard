import { Router, Request, Response } from "express";
import { registerWebhook, listWebhooks, deleteWebhook, rotateWebhookSecret } from "../services/webhookService";

export const webhooksRouter = Router();

webhooksRouter.get("/", (_req: Request, res: Response) => {
  const hooks = listWebhooks();
  // Mask secret in list queries for security
  const safeHooks = hooks.map((h) => ({
    ...h,
    secret: `${h.secret.slice(0, 6)}...${h.secret.slice(-4)}`,
  }));
  res.status(200).json({ success: true, count: safeHooks.length, webhooks: safeHooks });
});

webhooksRouter.post("/", (req: Request, res: Response) => {
  const { url, eventFilter, secret } = req.body;
  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "Missing required parameter 'url'" });
    return;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      res.status(400).json({ error: "Webhook URL must use http or https protocol" });
      return;
    }
  } catch {
    res.status(400).json({ error: "Invalid webhook URL format" });
    return;
  }

  const hook = registerWebhook(url, eventFilter ?? "*", secret);
  res.status(201).json({
    success: true,
    message: "Webhook registered successfully. Secure your secret for signature verification.",
    webhook: hook,
  });
});

webhooksRouter.post("/:id/rotate-secret", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid webhook ID" });
    return;
  }

  const customSecret = typeof req.body?.newSecret === "string" ? req.body.newSecret : undefined;
  const result = rotateWebhookSecret(id, customSecret);

  if (!result) {
    res.status(404).json({ error: "Webhook not found" });
    return;
  }

  res.status(200).json({
    success: true,
    message: `Secret rotated for webhook #${id}. Update your subscriber endpoint verification.`,
    webhookId: id,
    newSecret: result.newSecret,
  });
});

webhooksRouter.delete("/:id", (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid webhook ID" });
    return;
  }

  const deleted = deleteWebhook(id);
  if (!deleted) {
    res.status(404).json({ error: "Webhook not found or already deleted" });
    return;
  }

  res.status(200).json({ success: true, message: `Webhook #${id} deleted` });
});
