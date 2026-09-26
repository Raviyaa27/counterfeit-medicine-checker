"use client";

import { useReadContract } from "wagmi";
import { chain, registryAddress } from "@/lib/config";
import { registryAbi } from "@/lib/registryAbi";

// Shows "Pharmacy A, Galle" instead of 0x90F7...b906
export function OrgName({ address }: { address: `0x${string}` }) {
  const { data } = useReadContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: "orgName",
    args: [address],
    chainId: chain.id,
  });
  return <>{data || address}</>;
}
