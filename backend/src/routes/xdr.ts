import { Router, Request, Response } from "express";
import * as StellarSdk from "@stellar/stellar-sdk";

export const xdrRouter = Router();

const DEFAULT_PASSPHRASE = process.env.NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

xdrRouter.post("/decode", async (req: Request, res: Response) => {
  const { xdr, networkPassphrase } = req.body;
  if (!xdr || typeof xdr !== "string") {
    res.status(400).json({ error: "Missing required parameter 'xdr' (base64 string)" });
    return;
  }

  const passphrase = networkPassphrase ?? DEFAULT_PASSPHRASE;

  try {
    const tx = StellarSdk.TransactionBuilder.fromXDR(xdr, passphrase);

    const isFeeBump = tx instanceof StellarSdk.FeeBumpTransaction;
    const innerTx = isFeeBump ? tx.innerTransaction : tx;

    const operations = innerTx.operations.map((op, index) => {
      const parsedOp: Record<string, unknown> = {
        index,
        type: op.type,
      };

      if (op.type === "invokeHostFunction") {
        const invokeOp = op as any;
        parsedOp.hostFunctionType = invokeOp.func?.switch?.()?.name ?? "unknown";
        if (invokeOp.auth) {
          parsedOp.authEntriesCount = invokeOp.auth.length;
        }
      } else if (op.type === "payment") {
        const paymentOp = op as StellarSdk.Operation.Payment;
        parsedOp.destination = paymentOp.destination;
        parsedOp.amount = paymentOp.amount;
        parsedOp.asset = paymentOp.asset.isNative() ? "XLM" : paymentOp.asset.code;
      }

      return parsedOp;
    });

    const signatures = tx.signatures.map((sig) => ({
      hint: sig.hint().toString("hex"),
      signature: sig.signature().toString("base64"),
    }));

    const source = isFeeBump ? tx.feeSource : tx.source;

    res.status(200).json({
      success: true,
      isFeeBump,
      source,
      fee: tx.fee,
      sequence: innerTx.sequence,
      operationCount: innerTx.operations.length,
      operations,
      signatures,
      networkPassphrase: passphrase,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: "Failed to decode XDR transaction",
      details: err.message || String(err),
    });
  }
});
