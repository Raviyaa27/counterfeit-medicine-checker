"use client";

import { useState } from "react";
import { useConnection } from "wagmi";
import { useBatches, useParticipants } from "@/hooks/useRegistry";
import { useTxAction } from "@/hooks/useTxAction";
import { ROLES, ROLE_LABELS } from "@/lib/roles";
import { sendTx } from "@/lib/tx";
import { CustodyTrail } from "./CustodyTrail";
import { TxMessage } from "./TxMessage";

export function SupplyPanel() {
  const { address } = useConnection();
  const { data: batches } = useBatches();
  const { data: participants } = useParticipants();
  const ship = useTxAction();
  const [batchChoice, setBatchChoice] = useState("");
  const [toChoice, setToChoice] = useState("");
  const [trailChoice, setTrailChoice] = useState("");

  // Only approved batches that the connected wallet currently holds can be shipped.
  const mine = (batches ?? []).filter(
    (b) => b.status === 2 && address && b.holder.toLowerCase() === address.toLowerCase(),
  );
  const recipients = (participants ?? []).filter(
    (p) =>
      (p.role === ROLES.DISTRIBUTOR || p.role === ROLES.PHARMACY) &&
      p.account.toLowerCase() !== address?.toLowerCase(),
  );

  const batchId = mine.some((b) => b.id.toString() === batchChoice) ? batchChoice : (mine[0]?.id.toString() ?? "");
  const to = recipients.some((p) => p.account === toChoice) ? toChoice : (recipients[0]?.account ?? "");
  const trailId = (batches ?? []).some((b) => b.id.toString() === trailChoice)
    ? trailChoice
    : (batches?.[batches.length - 1]?.id.toString() ?? "");

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Ship a batch</h2>
        {!address ? (
          <p className="text-zinc-500">Connect your wallet to see the batches you hold.</p>
        ) : mine.length === 0 ? (
          <p className="text-zinc-500">Your wallet holds no approved batches to ship.</p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const target = recipients.find((p) => p.account === to);
              ship.run(
                () => sendTx("transferBatch", [BigInt(batchId), to as `0x${string}`]),
                `Batch #${batchId} shipped to ${target?.name ?? to}.`,
              );
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-medium" htmlFor="ship-batch">Batch</label>
                <select id="ship-batch" className="input" value={batchId} onChange={(e) => setBatchChoice(e.target.value)}>
                  {mine.map((b) => (
                    <option key={b.id.toString()} value={b.id.toString()} className="text-black">
                      #{b.id.toString()} · {b.drugName} · {b.batchNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-medium" htmlFor="ship-to">Ship to</label>
                <select id="ship-to" className="input" value={to} onChange={(e) => setToChoice(e.target.value)}>
                  {recipients.map((p) => (
                    <option key={`${p.account}-${p.role}`} value={p.account} className="text-black">
                      {p.name} ({ROLE_LABELS[p.role]})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn" disabled={!batchId || !to || ship.busy}>Ship batch</button>
          </form>
        )}
        <TxMessage status={ship.status} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Custody trail</h2>
        {batches?.length ? (
          <>
            <select
              aria-label="Batch for custody trail"
              className="input"
              value={trailId}
              onChange={(e) => setTrailChoice(e.target.value)}
            >
              {batches.map((b) => (
                <option key={b.id.toString()} value={b.id.toString()} className="text-black">
                  #{b.id.toString()} · {b.drugName} · {b.batchNumber}
                </option>
              ))}
            </select>
            {trailId && <CustodyTrail batchId={BigInt(trailId)} />}
          </>
        ) : (
          <p className="text-zinc-500">No batches registered yet.</p>
        )}
      </section>
    </div>
  );
}
