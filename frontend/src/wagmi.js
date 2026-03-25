// src/wagmi.jsx
import { configureChains, createConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { InjectedConnector } from "wagmi/connectors/injected";

// Sepolia Chain
export const sepolia = {
  id: 11155111,
  name: "Sepolia",
  network: "sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    public: { http: ["https://rpc.sepolia.org"] },
    default: { http: ["https://rpc.sepolia.org"] },
  },
  blockExplorers: {
    default: { name: "Etherscan", url: "https://sepolia.etherscan.io" },
  },
};

// Múltiplos RPCs para fallback
const RPC_URLS = [
  "https://rpc.sepolia.org",
  "https://sepolia.gateway.tenderly.co",
  "https://ethereum-sepolia.publicnode.com",
  "https://1rpc.io/sepolia",
];

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [sepolia],
  [
    jsonRpcProvider({
      rpc: () => ({ 
        http: RPC_URLS[Math.floor(Math.random() * RPC_URLS.length)] 
      }),
    }),
    publicProvider(),
  ]
);

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({ 
      chains,
      options: {
        name: 'MetaMask',
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
});
