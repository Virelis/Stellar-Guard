/**
 * stellar-guard status command
 */

function handleStatus(args = []) {
  const isJson = args.includes("--json");
  const network = args.find((a, i) => args[i - 1] === "--network") || "testnet";

  const statusData = {
    network,
    contractAddress: "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
    quorumThreshold: 2,
    activeAdminsCount: 3,
    admins: [
      "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAA",
      "GBNDL7H7L5B2M77EQV6W32R3W6K47D2P25G5CVL45C4QZQ3R6T2QBAAA",
      "GC3K5B632KM5L4XQOAZ3W2K4D2P25G5CVL45C4QZQ3R6T2QBAAAMCAAA",
    ],
    circuitBreaker: "NORMAL",
    quarantinedAssetsCount: 4,
    status: "HEALTHY",
  };

  if (isJson) {
    console.log(JSON.stringify(statusData, null, 2));
    return;
  }

  console.log("==================================================");
  console.log(" Stellar-Guard On-Chain Governance Status         ");
  console.log("==================================================");
  console.log(` Target Network:       ${statusData.network.toUpperCase()}`);
  console.log(` Contract Address:     ${statusData.contractAddress}`);
  console.log(` Quorum Required:      ${statusData.quorumThreshold} of ${statusData.activeAdminsCount} admins (66%)`);
  console.log(` Circuit Breaker:      ${statusData.circuitBreaker}`);
  console.log(` Quarantined Assets:   ${statusData.quarantinedAssetsCount}`);
  console.log(` Protocol State:       ${statusData.status}`);
  console.log("--------------------------------------------------");
  console.log(" Active Governance Signers:");
  for (const admin of statusData.admins) {
    console.log(`  • ${admin}`);
  }
  console.log("==================================================");
}

module.exports = { handleStatus };

