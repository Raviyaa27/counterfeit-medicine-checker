"use client";

import { useState } from "react";
import { isAddress } from "viem";
import { useTxAction } from "@/hooks/useTxAction";
import { ROLES, ROLE_LABELS } from "@/lib/roles";
import { sendTx } from "@/lib/tx";
import { TxMessage } from "./TxMessage";

export function RegisterParticipantForm() {
  const [account, setAccount] = useState("");
  const [role, setRole] = useState<`0x${string}`>(ROLES.MANUFACTURER);
  const [name, setName] = useState("");
  const { busy, status, run } = useTxAction();

  const valid = isAddress(account) && name.trim().length > 0;

  async function onSubmit() {
    const done = await run(
      () => sendTx("registerParticipant", [account as `0x${string}`, role, name.trim()]),
      `Registered ${name.trim()} as ${ROLE_LABELS[role]}.`,
    );
    if (done) {
      setAccount("");
      setName("");
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div>
        <label className="mb-1 block font-medium" htmlFor="acct">Wallet address</label>
        <input id="acct" className="input font-mono" value={account} onChange={(e) => setAccount(e.target.value.trim())} placeholder="0x..." />
        {account && !isAddress(account) && <p className="text-sm text-amber-600">That is not a valid address.</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block font-medium" htmlFor="role">Role</label>
          <select id="role" className="input" value={role} onChange={(e) => setRole(e.target.value as `0x${string}`)}>
            {Object.values(ROLES).map((r) => (
              <option key={r} value={r} className="text-black">{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-medium" htmlFor="org">Organisation name</label>
          <input id="org" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Pharmacy B, Kandy" />
        </div>
      </div>
      <button type="submit" className="btn" disabled={!valid || busy}>Register participant</button>
      <TxMessage status={status} />
    </form>
  );
}
