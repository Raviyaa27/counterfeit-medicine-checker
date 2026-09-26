import type { TxStatus } from "@/hooks/useTxAction";

export function TxMessage({ status }: { status: TxStatus }) {
  if (!status) return null;
  return (
    <p className={status.ok ? "text-green-600" : "font-medium text-red-600"} role="status">
      {status.text}
    </p>
  );
}
