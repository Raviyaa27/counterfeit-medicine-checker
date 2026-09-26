import { ConnectButton } from "@/components/ConnectButton";
import { SupplyPanel } from "@/components/SupplyPanel";

export default function SupplyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Supply chain: ship a batch</h1>
      <ConnectButton />
      <SupplyPanel />
    </main>
  );
}
