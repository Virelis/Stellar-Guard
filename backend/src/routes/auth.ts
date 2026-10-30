import { Router, Request, Response } from "express";
import { buildChallengeTx, getServerPublicKey } from "../services/sep10Service";
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
