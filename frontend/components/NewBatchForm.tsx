"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { keccak256, parseEventLogs, toHex } from "viem";
import { simulateContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { chain, config, registryAddress } from "@/lib/config";
import { registryAbi } from "@/lib/registryAbi";
import { friendlyError } from "@/lib/tx";

const MAX_PACKS = 200;

// Each pack gets a random 128-bit serial. Only its hash goes on-chain at registration.
function newSerial(): `0x${string}` {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

function downloadCsv(batchNumber: string, serials: `0x${string}`[]) {
  const origin = window.location.origin;
  const rows = ["pack,serial,verify_url"];
  serials.forEach((s, i) => rows.push(`${i + 1},${s},${origin}/verify?s=${s}`));
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `serials-${batchNumber.replace(/[^\w-]/g, "_")}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function NewBatchForm() {
  const [drugName, setDrugName] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [packs, setPacks] = useState("10");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [result, setResult] = useState<{
    batchId: bigint | null;
    batchNumber: string;
    drugName: string;
    serials: `0x${string}`[];
  } | null>(null);

  const packCount = Number(packs);
  // End of the chosen day in the user's own time zone (no "Z"), so the page shows the same date
  const expirySeconds = expiry ? Math.floor(Date.parse(`${expiry}T23:59:59`) / 1000) : 0;
  const problem = !drugName.trim()
    ? "Enter the medicine name."
    : !batchNumber.trim()
      ? "Enter the batch number."
      : !expiry
        ? "Pick an expiry date."
        : !Number.isInteger(packCount) || packCount < 1 || packCount > MAX_PACKS
          ? `Packs must be a whole number from 1 to ${MAX_PACKS}.`
          : null;

  async function onRegister() {
    if (problem) return;
    if (expirySeconds <= Date.now() / 1000) {
      setStatus({ ok: false, text: "The expiry date must be in the future." });
      return;
    }
    const fresh = Array.from({ length: packCount }, newSerial);
    setBusy(true);
    setResult(null);
    setStatus({ ok: true, text: "Waiting for MetaMask..." });
    try {
      const { request } = await simulateContract(config, {
        address: registryAddress,
        abi: registryAbi,
        functionName: "registerBatch",
        args: [drugName.trim(), batchNumber.trim(), BigInt(expirySeconds), fresh.map((s) => keccak256(s))],
        chainId: chain.id,
      });
      const hash = await writeContract(config, request);
      const receipt = await waitForTransactionReceipt(config, { hash, chainId: chain.id });
      const [event] = parseEventLogs({ abi: registryAbi, logs: receipt.logs, eventName: "BatchRegistered" });
      // show QR codes only after the batch is on-chain
      setResult({
        batchId: event?.args.batchId ?? null,
        batchNumber: batchNumber.trim(),
        drugName: drugName.trim(),
        serials: fresh,
      });
      setStatus({ ok: true, text: "Batch registered." });
    } catch (err) {
      setStatus({ ok: false, text: friendlyError(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onRegister();
        }}
      >
        <div>
          <label className="mb-1 block font-medium" htmlFor="drug">Medicine name</label>
          <input id="drug" className="input" value={drugName} onChange={(e) => setDrugName(e.target.value)} placeholder="Paracetamol 500mg" />
        </div>
        <div>
          <label className="mb-1 block font-medium" htmlFor="batch">Batch number</label>
          <input id="batch" className="input" value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)} placeholder="PARA-2026-002" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block font-medium" htmlFor="expiry">Expiry date</label>
            <input id="expiry" type="date" className="input" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block font-medium" htmlFor="packs">Packs (1 to {MAX_PACKS})</label>
            <input id="packs" type="number" min={1} max={MAX_PACKS} className="input" value={packs} onChange={(e) => setPacks(e.target.value)} />
          </div>
        </div>
        {problem && (drugName || batchNumber || expiry) && <p className="text-sm text-amber-600">{problem}</p>}
        <button type="submit" className="btn" disabled={!!problem || busy}>
          Register batch
        </button>
        {status && (
          <p className={status.ok ? "text-green-600" : "font-medium text-red-600"} role="status">
            {status.text}
          </p>
        )}
      </form>

      {result && (
        <section className="space-y-4">
          <div className="rounded-lg border border-green-600 p-4">
            <p className="text-lg font-semibold">Batch ID: {result.batchId?.toString() ?? "unknown"}</p>
            <p>The NMRA must approve this batch before the packs verify as genuine.</p>
          </div>
          <div className="rounded-lg border border-amber-500 p-4 text-sm">
            <strong>Serials are secrets.</strong> Anyone with this list can print codes that pass as
            genuine. Download it only if you need it, and never commit it or share it in chat. These
            codes disappear when you leave this page, so print or save them now.
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn" onClick={() => window.print()}>Print QR sheet</button>
            <button className="btn-secondary" onClick={() => downloadCsv(result.batchNumber, result.serials)}>
              Download serials (CSV)
            </button>
          </div>
          <div id="qr-sheet">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 print:grid-cols-4">
              {result.serials.map((s, i) => (
                <figure key={s} className="flex flex-col items-center break-inside-avoid gap-1 rounded bg-white p-2 text-black">
                  <QRCodeSVG value={`${window.location.origin}/verify?s=${s}`} size={128} />
                  <figcaption className="text-center text-xs">
                    {result.drugName}<br />{result.batchNumber} #{i + 1}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
