"use client";

import { useQuery } from "@tanstack/react-query";
import { getAbiItem } from "viem";
import { getPublicClient, readContract } from "wagmi/actions";
import { chain, config, registryAddress } from "@/lib/config";
import { registryAbi } from "@/lib/registryAbi";

const read = { address: registryAddress, abi: registryAbi, chainId: chain.id } as const;

// Sepolia RPC providers limit eth_getLogs ranges, so deployments can set the first block.
const FROM_BLOCK = BigInt(process.env.NEXT_PUBLIC_DEPLOY_BLOCK ?? "0");

// Anvil has no multicall contract, so these use plain calls.
export function useBatches() {
  return useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const count = Number(await readContract(config, { ...read, functionName: "batchCount" }));
      const ids = Array.from({ length: count }, (_, i) => BigInt(i + 1));
      const batches = await Promise.all(
        ids.map((id) => readContract(config, { ...read, functionName: "getBatch", args: [id] })),
      );
      return batches.map((b, i) => ({ id: ids[i], ...b }));
    },
  });
}

export type Participant = { account: `0x${string}`; role: `0x${string}`; name: string };

// Everyone who is currently registered in a supply-chain role.
export function useParticipants() {
  return useQuery({
    queryKey: ["participants"],
    queryFn: async (): Promise<Participant[]> => {
      const client = getPublicClient(config, { chainId: chain.id });
      if (!client) return [];
      const logs = await client.getLogs({
        address: registryAddress,
        event: getAbiItem({ abi: registryAbi, name: "ParticipantRegistered" }),
        fromBlock: FROM_BLOCK,
        toBlock: "latest",
      });
      const seen = new Map<string, Participant>();
      for (const l of logs) {
        const { account, role, name } = l.args;
        if (!account || !role) continue;
        seen.set(`${account}-${role}`, { account, role, name: name ?? "" });
      }
      const active = await Promise.all(
        [...seen.values()].map(async (p) =>
          (await readContract(config, { ...read, functionName: "hasRole", args: [p.role, p.account] })) ? p : null,
        ),
      );
      return active.filter((p): p is Participant => p !== null);
    },
  });
}
