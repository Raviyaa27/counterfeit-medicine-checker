"use client";

import { useReadContract } from "wagmi";
import { chain, registryAddress } from "@/lib/config";
import { fmtDateTime } from "@/lib/format";
import { registryAbi } from "@/lib/registryAbi";
import { OrgName } from "./OrgName";

export function CustodyTrail({ batchId }: { batchId: bigint }) {
  const { data: trail } = useReadContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: "getTrail",
    args: [batchId],
    chainId: chain.id,
  });
  if (!trail || trail.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold">Custody trail</h2>
      <ol className="space-y-2 border-l-2 border-zinc-300 pl-4">
        {trail.map((h, i) => (
          <li key={i} className="text-base">
            <span className="font-medium">
              <OrgName address={h.from} /> &rarr; <OrgName address={h.to} />
            </span>
            <span className="block text-sm text-zinc-500">{fmtDateTime(h.at)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
