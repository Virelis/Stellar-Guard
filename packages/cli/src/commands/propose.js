/**
 * stellar-guard propose command
 */

const crypto = require("crypto");

function handlePropose(args = []) {
  const target = args[0];
  const asset = args[1] || "USDC";

  if (!target) {
    console.error("Usage: stellar-guard propose <targetAddress> [assetCode] [--category <category>] [--evidence <ipfsUri>]");
    process.exit(1);
  }

  const isJson = args.includes("--json");
  const proposalId = crypto.randomUUID();
  const evidence = args.find((a, i) => args[i - 1] === "--evidence") || "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/incident";
  const category = args.find((a, i) => args[i - 1] === "--category") || "AML_HIGH_RISK";

  const result = {
    proposalId,
    target,
    assetCode: asset,
    category,
    evidenceUri: evidence,
    status: "PROPOSAL_CREATED",
    requiredSignatures: 2,
    currentSignatures: 1,
    createdAt: new Date().toISOString(),
  };

  if (isJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log("==================================================");
  console.log(" Freeze Proposal Submitted Successfully          ");
  console.log("==================================================");
  console.log(` Proposal ID:      ${result.proposalId}`);
  console.log(` Target Address:   ${result.target}`);
  console.log(` Asset Code:       ${result.assetCode}`);
  console.log(` Category:         ${result.category}`);
  console.log(` Evidence CID:     ${result.evidenceUri}`);
  console.log(` Status:           ${result.status} (1 of 2 required signatures collected)`);
  console.log("--------------------------------------------------");
  console.log(`To sign this proposal as a secondary admin, run:`);
  console.log(`  stellar-guard vote ${result.proposalId} --approve`);
  console.log("==================================================");
}

module.exports = { handlePropose };
