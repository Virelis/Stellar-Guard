import axios from "axios";
import request from "supertest";
import * as StellarSdk from "@stellar/stellar-sdk";
import app from "../src/index";
import { clearSorobanRpcCache } from "../src/services/sorobanRpc";

describe("GET /api/freeze/admins (#7)", () => {
  const originalContractId = process.env.FREEZE_CONTRACT_ID;
  const originalAdminAddresses = process.env.ADMIN_ADDRESSES;

  const VALID_CONTRACT_ID = StellarSdk.StrKey.encodeContract(Buffer.alloc(32, 7));
  const ADMIN_1 = StellarSdk.Keypair.random().publicKey();
  const ADMIN_2 = StellarSdk.Keypair.random().publicKey();
  const ADMIN_3 = StellarSdk.Keypair.random().publicKey();

  beforeEach(() => {
    clearSorobanRpcCache();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalContractId === undefined) {
      delete process.env.FREEZE_CONTRACT_ID;
    } else {
      process.env.FREEZE_CONTRACT_ID = originalContractId;
    }

    if (originalAdminAddresses === undefined) {
      delete process.env.ADMIN_ADDRESSES;
    } else {
      process.env.ADMIN_ADDRESSES = originalAdminAddresses;
    }
  });

  it("simulates get_admins via Soroban RPC and returns { admins: string[] }", async () => {
    process.env.FREEZE_CONTRACT_ID = VALID_CONTRACT_ID;

    const scVec = StellarSdk.xdr.ScVal.scvVec([
      StellarSdk.Address.fromString(ADMIN_1).toScVal(),
      StellarSdk.Address.fromString(ADMIN_2).toScVal(),
      StellarSdk.Address.fromString(ADMIN_3).toScVal(),
    ]);

    const postSpy = jest.spyOn(axios, "post").mockResolvedValueOnce({
      data: {
        jsonrpc: "2.0",
        id: 1,
        result: {
          results: [{ xdr: scVec.toXDR("base64") }],
        },
      },
    } as any);

    const res = await request(app).get("/api/freeze/admins");

    expect(res.status).toBe(200);
    expect(res.body.admins).toEqual([ADMIN_1, ADMIN_2, ADMIN_3]);
    expect(res.body.source).toBe("chain");
    expect(postSpy).toHaveBeenCalledTimes(1);
    expect(postSpy.mock.calls[0][1]).toMatchObject({
      jsonrpc: "2.0",
      method: "simulateTransaction",
    });
  });

  it("falls back gracefully when Soroban RPC is unreachable", async () => {
    process.env.FREEZE_CONTRACT_ID = VALID_CONTRACT_ID;
    process.env.ADMIN_ADDRESSES = `${ADMIN_1}, ${ADMIN_2}, invalid-address`;

    jest.spyOn(axios, "post").mockRejectedValueOnce(new Error("connect ECONNREFUSED"));

    const res = await request(app).get("/api/freeze/admins");

    expect(res.status).toBe(200);
    expect(res.body.admins).toEqual([ADMIN_1, ADMIN_2]);
    expect(res.body.source).toBe("fallback");
  });

  it("returns empty admins array gracefully when contract and fallback env are unset", async () => {
    delete process.env.FREEZE_CONTRACT_ID;
    delete process.env.ADMIN_ADDRESSES;

    const postSpy = jest.spyOn(axios, "post");
    const res = await request(app).get("/api/freeze/admins");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ admins: [], source: "fallback" });
    expect(postSpy).not.toHaveBeenCalled();
  });
});
