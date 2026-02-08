import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Celo Sepolia config
const chain = {
  id: 11142220,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://celo-sepolia.drpc.org"] } },
};

const IDENTITY_REGISTRY = "0x8004A818BFB912233c491871b3d84c89A494BD9e";

// Minimal ABI for Identity Registry register function
const identityAbi = parseAbi([
  "function register(string calldata agentURI) external returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
]);

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
if (!privateKey) {
  console.error("Set DEPLOYER_PRIVATE_KEY");
  process.exit(1);
}

const account = privateKeyToAccount(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);

const walletClient = createWalletClient({
  account,
  chain,
  transport: http("https://celo-sepolia.drpc.org"),
});

const publicClient = createPublicClient({
  chain,
  transport: http("https://celo-sepolia.drpc.org"),
});

// Use a raw URL to the registration JSON on GitHub
const agentURI = "https://raw.githubusercontent.com/bigguybobby/celo-pay-agent/main/agent-registration.json";

console.log("Registering agent on ERC-8004 Identity Registry...");
console.log("Registry:", IDENTITY_REGISTRY);
console.log("Agent URI:", agentURI);
console.log("Sender:", account.address);

try {
  const hash = await walletClient.writeContract({
    address: IDENTITY_REGISTRY,
    abi: identityAbi,
    functionName: "register",
    args: [agentURI],
  });

  console.log("TX Hash:", hash);

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log("Status:", receipt.status);
  console.log("Block:", receipt.blockNumber);

  // Find the Transfer event to get the agentId (tokenId)
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() === IDENTITY_REGISTRY.toLowerCase()) {
      // Transfer event topic
      if (log.topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
        const agentId = BigInt(log.topics[3]);
        console.log("🤖 Agent ID:", agentId.toString());
        console.log("✅ Agent registered successfully!");
      }
    }
  }
} catch (err) {
  console.error("Registration failed:", err.message || err);
}
