import { Router, Request, Response } from "express";
import { eventBus } from "../services/eventBus";

export const eventsRouter = Router();

eventsRouter.get(["/", "/stream"], (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  eventBus.registerClient(res);

  req.on("close", () => {
    eventBus.removeClient(res);
  });
});

eventsRouter.get("/stats", (_req: Request, res: Response) => {
  res.json({
    activeListeners: eventBus.getClientCount(),
    timestamp: new Date().toISOString(),
  });
});
