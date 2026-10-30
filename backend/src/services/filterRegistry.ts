import crypto from "crypto";
import { logger } from "./logger";

export interface AlertRule {
  id: string;
  name: string;
  eventType?: "freeze_proposed" | "freeze_executed" | "vote_cast" | "large_transfer" | "all";
  assetCode?: string;
  minAmount?: number;
  minRiskScore?: number;
  targetAddress?: string;
  destinationWebhookUrl?: string;
  enabled: boolean;
  createdAt: number;
}

export interface GovernanceEventPayload {
  eventType: "freeze_proposed" | "freeze_executed" | "vote_cast" | "large_transfer";
  assetCode?: string;
  amount?: number;
  targetAddress?: string;
  issuer?: string;
  riskScore?: number;
  adminKey?: string;
  details?: Record<string, any>;
}

class FilterRegistry {
  private rules: Map<string, AlertRule> = new Map();

  constructor() {
    // Default system notification rules
    this.addRule({
      name: "Default Critical Freeze Alert",
      eventType: "freeze_executed",
      enabled: true,
    });
    this.addRule({
      name: "High Risk Score Alert",
      minRiskScore: 70,
      enabled: true,
    });
  }

  public addRule(rule: Omit<AlertRule, "id" | "createdAt">): AlertRule {
    const id = crypto.randomUUID();
    const created: AlertRule = {
      ...rule,
      id,
      enabled: rule.enabled ?? true,
      createdAt: Date.now(),
    };
    this.rules.set(id, created);
    logger.info("Alert filter rule registered", { ruleId: id, name: created.name });
    return created;
  }

  public removeRule(id: string): boolean {
    const deleted = this.rules.delete(id);
    if (deleted) {
      logger.info("Alert filter rule deleted", { ruleId: id });
    }
    return deleted;
  }

  public getRule(id: string): AlertRule | undefined {
    return this.rules.get(id);
  }

  public listRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  public matchEvent(event: GovernanceEventPayload): AlertRule[] {
    const matches: AlertRule[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Event type check
      if (rule.eventType && rule.eventType !== "all" && rule.eventType !== event.eventType) {
        continue;
      }

      // Asset code check
      if (rule.assetCode && event.assetCode && rule.assetCode.toUpperCase() !== event.assetCode.toUpperCase()) {
        continue;
      }

      // Amount threshold
      if (rule.minAmount !== undefined && (event.amount === undefined || event.amount < rule.minAmount)) {
        continue;
      }

      // Risk score threshold
      if (rule.minRiskScore !== undefined && (event.riskScore === undefined || event.riskScore < rule.minRiskScore)) {
        continue;
      }

      // Target address check
      if (rule.targetAddress && event.targetAddress && rule.targetAddress !== event.targetAddress) {
        continue;
      }

      matches.push(rule);
    }

    return matches;
  }
}

export const filterRegistry = new FilterRegistry();
