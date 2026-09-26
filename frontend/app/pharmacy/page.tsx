import { ConnectButton } from "@/components/ConnectButton";
import { DispenseForm } from "@/components/DispenseForm";

export default function PharmacyPage() {
  return (
    <main className="mx-auto w-full max-w-xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Pharmacy: sell a pack</h1>
      <ConnectButton />
      <DispenseForm />
    </main>
  );
}
