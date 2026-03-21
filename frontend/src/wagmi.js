// src/wagmi.jsx (versão simplificada)
import { configureChains, createConfig } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";

// Use apenas HTTP (mais estável)
const RPC_ENDPOINT = "https://testnet-rpc.cess.network";

export const cessTestnet = {
  id: 11330,
  name: "CESS Testnet",
  network: "cess-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "CESS Token",
    symbol: "TCESS",
  },
  rpcUrls: {
    public: { http: [RPC_ENDPOINT] },
    default: { http: [RPC_ENDPOINT] },
  },
};

const { publicClient, webSocketPublicClient } = configureChains(
  [cessTestnet],
  [
    jsonRpcProvider({
      rpc: () => ({ http: RPC_ENDPOINT }),
    }),
  ]
);

export const wagmiConfig = createConfig({
  publicClient,
  webSocketPublicClient,
});
