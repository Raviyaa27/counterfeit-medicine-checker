"use client";

import { useState } from "react";
import { useBatches } from "@/hooks/useRegistry";
import { useTxAction } from "@/hooks/useTxAction";
import { fmtDate } from "@/lib/format";
import { BATCH_STATUS } from "@/lib/roles";
import { sendTx } from "@/lib/tx";
import { OrgName } from "./OrgName";
import { TxMessage } from "./TxMessage";

const STATUS_STYLE = ["", "bg-amber-500", "bg-green-600", "bg-red-600"];

export function BatchAdmin() {
  const { data: batches, isLoading, error } = useBatches();
  const approve = useTxAction();
  const recall = useTxAction();
  const [recallId, setRecallId] = useState("");
  const [reason, setReason] = useState("");

  const idValid = /^[1-9]\d*$/.test(recallId);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        {isLoading && <p>Loading batches...</p>}
        {error && <p className="text-red-600">Could not load batches.</p>}
        {batches?.length === 0 && <p className="text-zinc-500">No batches registered yet.</p>}
        <ul className="space-y-3">
          {batches?.map((b) => (
            <li key={b.id.toString()} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-300 p-3">
              <div>
                <p className="font-medium">#{b.id.toString()} · {b.drugName} · {b.batchNumber}</p>
                <p className="text-sm text-zinc-500">
                  Made by <OrgName address={b.manufacturer} />, held by <OrgName address={b.holder} />, expires {fmtDate(b.expiryDate)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded px-2 py-1 text-sm font-semibold text-white ${STATUS_STYLE[b.status]}`}>
                  {BATCH_STATUS[b.status]}
                </span>
                {BATCH_STATUS[b.status] === "Pending" && (
                  <button
                    className="btn"
                    disabled={approve.busy}
                    onClick={() => approve.run(() => sendTx("approveBatch", [b.id]), `Batch #${b.id} approved.`)}
                  >
                    Approve
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
        <TxMessage status={approve.status} />
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          recall
            .run(() => sendTx("recallBatch", [BigInt(recallId), reason.trim()]), `Batch #${recallId} recalled.`)
            .then((done) => {
              if (done) {
                setRecallId("");
                setReason("");
              }
            });
        }}
      >
        <h3 className="text-lg font-semibold">Recall a batch</h3>
        <div className="grid grid-cols-[8rem_1fr] gap-4">
          <div>
            <label className="mb-1 block font-medium" htmlFor="rid">Batch ID</label>
            <input id="rid" className="input" inputMode="numeric" value={recallId} onChange={(e) => setRecallId(e.target.value.trim())} />
          </div>
          <div>
            <label className="mb-1 block font-medium" htmlFor="reason">Reason</label>
            <input id="reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Contamination found in QC" />
          </div>
        </div>
        <button type="submit" className="btn-danger" disabled={!idValid || !reason.trim() || recall.busy}>
          Recall batch
        </button>
        <TxMessage status={recall.status} />
      </form>
    </div>
  );
}
