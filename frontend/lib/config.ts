import { createConfig, http } from "wagmi";
import { foundry, sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// NEXT_PUBLIC_CHAIN_ID: "31337" = local Anvil chain, "11155111" = Sepolia testnet
export const chain = process.env.NEXT_PUBLIC_CHAIN_ID === "31337" ? foundry : sepolia;
export const registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`;

export const config = createConfig({
  chains: [sepolia, foundry],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
    [foundry.id]: http(), // defaults to http://127.0.0.1:8545
  },
  ssr: true,
});
