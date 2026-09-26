"use client";

import { useParticipants } from "@/hooks/useRegistry";
import { ROLE_LABELS } from "@/lib/roles";

export function ParticipantList() {
  const { data, isLoading, error } = useParticipants();
  if (isLoading) return <p>Loading participants...</p>;
  if (error) return <p className="text-red-600">Could not load participants.</p>;
  if (!data?.length) return <p className="text-zinc-500">No participants registered yet.</p>;

  return (
    <ul className="divide-y divide-zinc-300 rounded-lg border border-zinc-300">
      {data.map((p) => (
        <li key={`${p.account}-${p.role}`} className="flex flex-wrap items-baseline justify-between gap-x-4 p-3">
          <span className="font-medium">{p.name}</span>
          <span className="text-sm text-zinc-500">
            {ROLE_LABELS[p.role] ?? "Unknown"} ·{" "}
            <span className="font-mono">{p.account.slice(0, 6)}...{p.account.slice(-4)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
