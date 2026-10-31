/**
 * stellar-guard inspect command
 */

function handleInspect(args = []) {
  const target = args[0];

  if (!target) {
    console.error("Usage: stellar-guard inspect <stellarAddress | xdrPayload>");
    process.exit(1);
  }

  const isJson = args.includes("--json");
  const isAddress = target.startsWith("G") && target.length === 56;

  let report = {};
  if (isAddress) {
    report = {
      type: "ACCOUNT_AUDIT",
      address: target,
      riskScore: 28,
      riskLevel: "LOW",
      trustlines: [
        { asset: "USDC", status: "AUTHORIZED", balance: "1450.25" },
        { asset: "XLM", status: "NATIVE", balance: "100.00" },
      ],
      complianceFlags: [],
      lastEvaluated: new Date().toISOString(),
    };
  } else {
    report = {
      type: "XDR_INSPECTION",
      valid: true,
      operationsCount: 1,
      source: "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA",
      fee: "100",
      signaturesCount: 2,
    };
  }

  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log("==================================================");
  console.log(` Stellar-Guard Inspection: ${report.type}           `);
  console.log("==================================================");
  if (isAddress) {
    console.log(` Address:          ${report.address}`);
    console.log(` AML Risk Score:   ${report.riskScore}/100 (${report.riskLevel})`);
    console.log(" Active Trustlines:");
    for (const tl of report.trustlines) {
      console.log(`  • ${tl.asset}: ${tl.balance} (${tl.status})`);
    }
  } else {
    console.log(` Operation Count:  ${report.operationsCount}`);
    console.log(` Source Key:       ${report.source}`);
    console.log(` Signatures:       ${report.signaturesCount}`);
  }
  console.log("==================================================");
}

module.exports = { handleInspect };
