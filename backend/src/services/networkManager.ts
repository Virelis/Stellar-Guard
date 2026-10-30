export interface StellarNetworkConfig {
  name: string;
  horizonUrl: string;
  sorobanRpcUrl: string;
  networkPassphrase: string;
  isTestnet: boolean;
  blockExplorerUrl: string;
}

export const NETWORKS: Record<string, StellarNetworkConfig> = {
  testnet: {
    name: "testnet",
    horizonUrl: "https://horizon-testnet.stellar.org",
    sorobanRpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
    isTestnet: true,
    blockExplorerUrl: "https://stellar.expert/explorer/testnet",
  },
  futurenet: {
    name: "futurenet",
    horizonUrl: "https://horizon-futurenet.stellar.org",
    sorobanRpcUrl: "https://rpc-futurenet.stellar.org",
    networkPassphrase: "Test SDF Future Network ; October 2022",
    isTestnet: true,
    blockExplorerUrl: "https://stellar.expert/explorer/futurenet",
  },
  mainnet: {
    name: "mainnet",
    horizonUrl: "https://horizon.stellar.org",
    sorobanRpcUrl: "https://soroban-rpc.stellar.org",
    networkPassphrase: "Public Global Stellar Network ; July 2015",
    isTestnet: false,
    blockExplorerUrl: "https://stellar.expert/explorer/public",
  },
  standalone: {
    name: "standalone",
    horizonUrl: "http://localhost:8000",
    sorobanRpcUrl: "http://localhost:8000/soroban/rpc",
    networkPassphrase: "Standalone Network ; February 2017",
    isTestnet: true,
    blockExplorerUrl: "http://localhost:8000",
  },
};

const defaultNetworkName = process.env.STELLAR_NETWORK?.toLowerCase() ?? "testnet";
let currentNetworkName = NETWORKS[defaultNetworkName] ? defaultNetworkName : "testnet";

export function getActiveNetwork(): StellarNetworkConfig {
  return NETWORKS[currentNetworkName];
}

export function switchNetwork(networkName: string): StellarNetworkConfig {
  const target = networkName.toLowerCase();
  if (!NETWORKS[target]) {
    throw new Error(`Unsupported network: '${networkName}'. Supported: ${Object.keys(NETWORKS).join(", ")}`);
  }
  currentNetworkName = target;
  return NETWORKS[currentNetworkName];
}

export function getAllNetworks(): Record<string, StellarNetworkConfig> {
  return { ...NETWORKS };
}
