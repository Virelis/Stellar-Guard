import { Router, Request, Response } from "express";
import { buildChallengeTx, verifyChallengeTx, getServerPublicKey } from "../services/sep10Service";
import { signAuthToken, Role } from "../middleware/auth";
import { isValidEd25519PublicKey } from "../utils/stellarValidator";

export const authRouter = Router();

function resolveUserRole(publicKey: string): Role {
  const adminWalletsRaw = process.env.ADMIN_WALLETS ?? "";
  const proposerWalletsRaw = process.env.PROPOSER_WALLETS ?? "";

  const adminWallets = adminWalletsRaw
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);
  const proposerWallets = proposerWalletsRaw
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);

  // In non-production without configured admin wallets, allow fallback for development
  if (process.env.NODE_ENV !== "production" && adminWallets.length === 0) {
    return "admin";
  }

  if (
    adminWallets.includes(publicKey) ||
    (process.env.NODE_ENV !== "production" && adminWallets.includes("*"))
  ) {
    return "admin";
  }
  if (proposerWallets.includes(publicKey)) {
    return "proposer";
  }
  return "auditor";
}

authRouter.get("/challenge", (req: Request, res: Response) => {
  const account = typeof req.query.account === "string" ? req.query.account : undefined;
  const homeDomain = typeof req.query.home_domain === "string" ? req.query.home_domain : undefined;

  if (!account) {
    res.status(400).json({ error: "Missing required query parameter 'account'" });
    return;
  }

  if (!isValidEd25519PublicKey(account)) {
    res.status(400).json({ error: "Invalid Stellar Ed25519 public key format" });
    return;
  }

  try {
    const challenge = buildChallengeTx(account, homeDomain);
    res.status(200).json({
      success: true,
      serverPublicKey: getServerPublicKey(),
      ...challenge,
    });
  } catch (err: any) {
    res.status(500).json({
      error: "Failed to generate SEP-0010 challenge",
      details: err.message,
    });
  }
});

authRouter.post("/token", (req: Request, res: Response) => {
  const { transaction } = req.body;
  if (!transaction || typeof transaction !== "string") {
    res
      .status(400)
      .json({ error: "Missing required parameter 'transaction' (signed challenge XDR)" });
    return;
  }

  const result = verifyChallengeTx(transaction);
  if (!result.valid || !result.clientPublicKey) {
    res.status(400).json({
      error: "Challenge verification failed",
      details: result.error,
    });
    return;
  }

  const role = resolveUserRole(result.clientPublicKey);
  const token = signAuthToken(result.clientPublicKey, role, 86400);

  res.status(200).json({
    success: true,
    token,
    role,
    clientPublicKey: result.clientPublicKey,
    tokenType: "Bearer",
    expiresIn: 86400,
  });
});
