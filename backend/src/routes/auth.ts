import { Router, Request, Response } from "express";
import { buildChallengeTx, verifyChallengeTx, getServerPublicKey } from "../services/sep10Service";
import { signAuthToken } from "../middleware/auth";
import { isValidEd25519PublicKey } from "../utils/stellarValidator";

export const authRouter = Router();

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
    res.status(400).json({ error: "Missing required parameter 'transaction' (signed challenge XDR)" });
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

  const token = signAuthToken(result.clientPublicKey, "admin", 86400);

  res.status(200).json({
    success: true,
    token,
    clientPublicKey: result.clientPublicKey,
    tokenType: "Bearer",
    expiresIn: 86400,
  });
});
