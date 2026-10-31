/**
 * Stellar-Guard Enterprise CLI Command Dispatcher
 */

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
Stellar-Guard Enterprise CLI (v1.0.0)
CAP-0077 Quorum Freeze & RWA Asset Protection on Stellar

USAGE:
  stellar-guard <command> [options]

COMMANDS:
  status                   Check Soroban governance contract state & network health
  propose <target> <asset> Propose an emergency asset quarantine
  vote <proposalId>        Cast an approval or rejection signature for a proposal
  inspect <targetAddress>  Inspect account risk score and trustline status
  version                  Display version information
  help                     Display this help menu

OPTIONS:
  --network <name>         Target network: testnet | standalone | futurenet
  --rpc <url>              Custom Soroban RPC URL
  --json                   Output results in structured JSON format
`);
}

function run() {
  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  if (command === "version" || command === "--version" || command === "-v") {
    console.log("stellar-guard v1.0.0");
    process.exit(0);
  }

  switch (command) {
    case "status": {
      const { handleStatus } = require("./commands/status");
      handleStatus(args.slice(1));
      break;
    }
    case "propose": {
      const { handlePropose } = require("./commands/propose");
      handlePropose(args.slice(1));
      break;
    }
    case "vote": {
      const { handleVote } = require("./commands/vote");
      handleVote(args.slice(1));
      break;
    }
    case "inspect": {
      const { handleInspect } = require("./commands/inspect");
      handleInspect(args.slice(1));
      break;
    }
    default: {
      console.error(`Unknown command: '${command}'. Run 'stellar-guard help' for available commands.`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  run();
}

module.exports = { run, printHelp };

