import { Router, Request, Response } from "express";
import { evaluateAccountRisk } from "../services/riskEngine";
import { isValidStellarAddress } from "../utils/stellarValidator";

export const riskRouter = Router();

riskRouter.get("/score/:address", (req: Request, res: Response) => {
  const address = req.params.address;
  if (!isValidStellarAddress(address)) {
    res.status(400).json({ error: "Invalid Stellar address or contract ID" });
    return;
  }

  const assessment = evaluateAccountRisk(address);
  res.status(200).json({
    success: true,
    ...assessment,
  });
});

riskRouter.post("/batch", (req: Request, res: Response) => {
  const { addresses } = req.body;
  if (!Array.isArray(addresses) || addresses.length === 0) {
    res.status(400).json({ error: "Missing required parameter 'addresses' (array of strings)" });
    return;
  }

  const sample = addresses.slice(0, 50); // limit to max 50 per batch
  const results = sample.map((addr) => {
    if (!isValidStellarAddress(addr)) {
      return { address: addr, valid: false, error: "Invalid address format" };
    }
    return { address: addr, valid: true, ...evaluateAccountRisk(addr) };
  });

  res.status(200).json({
    success: true,
    count: results.length,
    results,
  });
});
