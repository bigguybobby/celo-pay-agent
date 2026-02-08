import { http, createConfig } from "wagmi";
import { celoAlfajores } from "wagmi/chains";
import { getDefaultConfig } from "connectkit";

// Celo Sepolia is similar config to Alfajores — we override the RPC
const celoSepolia = {
  ...celoAlfajores,
  id: 44787, // using alfajores chain id for compatibility
  name: "Celo Sepolia",
  rpcUrls: {
    default: { http: ["https://celo-sepolia.drpc.org"] },
  },
} as const;

export const config = createConfig(
  getDefaultConfig({
    chains: [celoSepolia],
    transports: {
      [celoSepolia.id]: http("https://celo-sepolia.drpc.org"),
    },
    walletConnectProjectId: "placeholder", // TODO: get real WalletConnect project ID
    appName: "CeloPayAgent",
    appDescription: "AI-Powered Payment Agent on Celo",
  })
);
