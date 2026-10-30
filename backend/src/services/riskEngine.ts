import { horizonMonitor } from "./horizonMonitor";
import { getVotes } from "./voteStore";

export interface RiskFactor {
  code: string;
  description: string;
  weight: number;
}

export interface RiskAssessment {
  targetAddress: string;
  riskScore: number; // 0 - 100
  riskLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  factors: RiskFactor[];
  evaluatedAt: string;
}

export function evaluateAccountRisk(targetAddress: string): RiskAssessment {
  const factors: RiskFactor[] = [];
  let rawScore = 0;

  const transfers = horizonMonitor.getTransfers();
  const accountTransfers = transfers.filter(
    (t) => t.from === targetAddress || t.to === targetAddress
  );

  // 1. Check if account is currently subject to an active freeze proposal
  const activeUSDC = getVotes("USDC", "", targetAddress);
  const activeEURC = getVotes("EURC", "", targetAddress);
  if (activeUSDC || activeEURC) {
    factors.push({
      code: "ACTIVE_GOVERNANCE_PROPOSAL",
      description: "Account is actively named in a pending multi-sig freeze proposal",
      weight: 45,
    });
    rawScore += 45;
  }

  // 2. High payment velocity (e.g. > 5 transfers in recent buffer)
  if (accountTransfers.length >= 8) {
    factors.push({
      code: "HIGH_TRANSACTION_VELOCITY",
      description: `High transfer frequency detected (${accountTransfers.length} events in active buffer)`,
      weight: 25,
    });
    rawScore += 25;
  } else if (accountTransfers.length >= 4) {
    factors.push({
      code: "MODERATE_TRANSACTION_VELOCITY",
      description: `Elevated transfer activity (${accountTransfers.length} events)`,
      weight: 15,
    });
    rawScore += 15;
  }

  // 3. High single transaction volume
  const hasWhaleTransfer = accountTransfers.some((t) => t.amount >= 50000);
  if (hasWhaleTransfer) {
    factors.push({
      code: "LARGE_VOLUME_SPIKE",
      description: "Individual transaction exceeding 50,000 asset units detected",
      weight: 25,
    });
    rawScore += 25;
  }

  // 4. Structuring pattern: multiple transfers in 9,000 - 9,999 range (common AML avoidance)
  const structuringTransfers = accountTransfers.filter(
    (t) => t.amount >= 9000 && t.amount < 10000
  );
  if (structuringTransfers.length >= 2) {
    factors.push({
      code: "POTENTIAL_STRUCTURING",
      description: "Multiple transactions just under common regulatory reporting thresholds",
      weight: 30,
    });
    rawScore += 30;
  }

  const finalScore = Math.min(100, Math.max(0, rawScore));

  let riskLevel: RiskAssessment["riskLevel"] = "LOW";
  if (finalScore >= 80) {
    riskLevel = "CRITICAL";
  } else if (finalScore >= 55) {
    riskLevel = "HIGH";
  } else if (finalScore >= 30) {
    riskLevel = "MODERATE";
  }

  return {
    targetAddress,
    riskScore: finalScore,
    riskLevel,
    factors,
    evaluatedAt: new Date().toISOString(),
  };
}
