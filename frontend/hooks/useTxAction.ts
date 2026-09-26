"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { friendlyError } from "@/lib/tx";

export type TxStatus = { ok: boolean; text: string } | null;

// Runs one transaction, reports progress in plain words, then refreshes on-chain data.
export function useTxAction() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<TxStatus>(null);

  async function run(tx: () => Promise<unknown>, successText: string) {
    setBusy(true);
    setStatus({ ok: true, text: "Waiting for MetaMask..." });
    try {
      await tx();
      setStatus({ ok: true, text: successText });
      await queryClient.invalidateQueries();
      return true;
    } catch (err) {
      setStatus({ ok: false, text: friendlyError(err) });
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { busy, status, run };
}
