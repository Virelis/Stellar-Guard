import { recordVote } from "../services/voteStore";
import { recordAuditLog } from "../services/auditService";
import { registerWebhook } from "../services/webhookService";
import { logger } from "../services/logger";

export function seedDemoData(): { proposals: number; auditLogs: number; webhooks: number } {
  logger.info("[Seed] Seeding realistic Stellar-Guard demo data...");

  const admin1 = "GDNQHT2ETVXAVWA4SM2NF5OF64TBEBE4DTRVFK45DIFRC746QQPP2R4R";
  const admin2 = "GCYGUXOP36RFRMYHX2QDKBPRE6XCZNU3JIQDRVRUOKMDO4CGMSEANXJE";
  const issuer = "GBZXN7PIRZGNMHGA728R374MQDUET2KWGD4E2VMX7NWQQ6W5QJ6HMBX";

  // Target addresses
  const targetSanction = "GA2C5RFPE6GCKMY3US5PAB6UZLKIGAHWKXX2G2O2F7XCTU355W7V7OXX";
  const targetPhishing = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
  const targetRansomware = "GC4KAS6XV5YPW6Q62GECL42BLR7HLS6TGZKIJRMZM7MOCDT2SF7KNDR";

  // 1. Seed Multi-Sig Proposals
  recordVote("USDC", issuer, targetSanction, admin1);
  recordVote("USDC", issuer, targetSanction, admin2);
  recordVote("EURC", issuer, targetPhishing, admin1);
  recordVote("AUDD", issuer, targetRansomware, admin2);

  // 2. Seed Compliance Audit Trail
  recordAuditLog({
    eventType: "PROPOSAL_CREATED",
    assetCode: "USDC",
    issuer,
    target: targetSanction,
    adminKey: admin1,
    details: "OFAC Specially Designated Nationals (SDN) list match identified by Chainalysis oracle",
  });

  recordAuditLog({
    eventType: "VOTE_SUBMITTED",
    assetCode: "USDC",
    issuer,
    target: targetSanction,
    adminKey: admin2,
    details: "Second administrator approval cast, awaiting quorum execution",
  });

  recordAuditLog({
    eventType: "PROPOSAL_CREATED",
    assetCode: "EURC",
    issuer,
    target: targetPhishing,
    adminKey: admin1,
    details: "Phishing drainer attack contract detected draining retail trustlines",
  });

  recordAuditLog({
    eventType: "PROPOSAL_CREATED",
    assetCode: "AUDD",
    issuer,
    target: targetRansomware,
    adminKey: admin2,
    details: "Law enforcement request #LE-2026-9921 freeze mandate",
  });

  // 3. Seed Compliance Webhooks
  registerWebhook("https://compliance.institution.example.com/webhooks/stellar", "FREEZE_EXECUTED");
  registerWebhook("https://siem-collector.security.example.com/ingest", "*");

  logger.info("[Seed] Demo data seeding complete.");
  return { proposals: 3, auditLogs: 4, webhooks: 2 };
}

if (require.main === module) {
  seedDemoData();
}
