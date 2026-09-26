"use client";

import { keccak256 } from "viem";
import { useReadContract } from "wagmi";
import { sepolia } from "wagmi/chains";
import { chain, registryAddress } from "@/lib/config";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { registryAbi } from "@/lib/registryAbi";
import { CustodyTrail } from "./CustodyTrail";
import { OrgName } from "./OrgName";

// Order must match the Verdict enum in MedicineRegistry.sol
const VERDICTS = [
  { label: "NOT FOUND", hint: "This code is not registered. Likely counterfeit.", color: "bg-red-600" },
  { label: "NOT APPROVED", hint: "This batch has not been approved by NMRA yet.", color: "bg-amber-500" },
  { label: "GENUINE", hint: "Registered, approved and not yet sold.", color: "bg-green-600" },
  { label: "ALREADY SOLD", hint: "This pack was already sold. If you didn't buy it there, it may be a copy.", color: "bg-amber-500" },
  { label: "RECALLED", hint: "Do not use this medicine.", color: "bg-red-600" },
  { label: "EXPIRED", hint: "This medicine is past its expiry date.", color: "bg-red-600" },
] as const;

function ChainNote() {
  const explorer = chain.blockExplorers?.default.url;
  return (
    <p className="text-sm text-zinc-500">
      Checked on the {chain.id === sepolia.id ? "Ethereum Sepolia" : "local test"} blockchain.{" "}
      {explorer && (
        <a
          className="underline"
          href={`${explorer}/address/${registryAddress}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View the contract on Etherscan
        </a>
      )}
    </p>
  );
}

export function VerifyResult({ serial }: { serial: `0x${string}` }) {
  // Reads are free and need no wallet, so patients can verify without MetaMask.
  const { data, isLoading, error } = useReadContract({
    address: registryAddress,
    abi: registryAbi,
    functionName: "verify",
    args: [keccak256(serial)],
    chainId: chain.id,
  });

  if (isLoading) return <p className="mt-6 text-lg">Checking the blockchain...</p>;
  if (error || !data) return <p className="mt-6 text-lg">Could not reach the network. Try again.</p>;

  const [verdict, batchId, batch, dispensedBy, dispensedAt] = data;
  const v = VERDICTS[verdict];

  return (
    <div className="mt-6 space-y-6">
      <div className={`${v.color} rounded-2xl p-6 text-white shadow`} role="status">
        <p className="text-4xl font-extrabold tracking-tight">{v.label}</p>
        <p className="mt-2 text-lg">{v.hint}</p>
      </div>

      {Number(batchId) > 0 && (
        <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-lg">
            <dt className="text-zinc-500">Medicine</dt>
            <dd className="font-medium">{batch.drugName}</dd>
            <dt className="text-zinc-500">Batch</dt>
            <dd className="font-medium">{batch.batchNumber}</dd>
            <dt className="text-zinc-500">Expires</dt>
            <dd className="font-medium">{fmtDate(batch.expiryDate)}</dd>
            {Number(dispensedAt) > 0 && (
              <>
                <dt className="text-zinc-500">Sold by</dt>
                <dd className="font-medium">
                  <OrgName address={dispensedBy} /> on {fmtDateTime(dispensedAt)}
                </dd>
              </>
            )}
          </dl>
          <CustodyTrail batchId={batchId} />
        </>
      )}

      <ChainNote />
    </div>
  );
}
