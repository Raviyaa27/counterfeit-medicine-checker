"use client";

import { useState } from "react";
import { simulateContract, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { chain, config, registryAddress } from "@/lib/config";
import { registryAbi } from "@/lib/registryAbi";
import { friendlyError } from "@/lib/tx";

const SERIAL_RE = /^0x[0-9a-fA-F]{32}$/;

// Accepts a raw serial or a pasted verify link (https://site/verify?s=0x...)
function parseSerial(input: string): string {
  const text = input.trim();
  try {
    return new URL(text).searchParams.get("s") ?? text;
  } catch {
    return text;
  }
}

export function DispenseForm() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const serial = parseSerial(input);
  const valid = SERIAL_RE.test(serial);

  async function onDispense() {
    setBusy(true);
    setStatus({ ok: true, text: "Waiting for MetaMask..." });
    try {
      // 1. Simulate: fails fast with a readable reason (e.g. AlreadyDispensed)
      const { request } = await simulateContract(config, {
        address: registryAddress,
        abi: registryAbi,
        functionName: "dispense",
        args: [serial as `0x${string}`],
        chainId: chain.id,
      });
      // 2. Send, 3. wait for confirmation
      const hash = await writeContract(config, request);
      await waitForTransactionReceipt(config, { hash, chainId: chain.id });
      setStatus({ ok: true, text: "Sold. This pack is now marked as sold on the blockchain." });
      setInput("");
    } catch (err) {
      setStatus({ ok: false, text: friendlyError(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block font-medium" htmlFor="serial">
        Pack serial (or the link from its QR code)
      </label>
      <input
        id="serial"
        className="input font-mono"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="0x... or https://.../verify?s=0x..."
      />
      {input && !valid && (
        <p className="text-sm text-amber-600">
          A serial is 0x followed by 32 hex characters.
        </p>
      )}
      <button className="btn" onClick={onDispense} disabled={!valid || busy}>
        Mark as sold
      </button>
      {status && (
        <p className={status.ok ? "text-green-600" : "font-medium text-red-600"} role="status">
          {status.text}
        </p>
      )}
    </div>
  );
}
