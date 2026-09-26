import { ConnectButton } from "@/components/ConnectButton";
import { NewBatchForm } from "@/components/NewBatchForm";

export default function ManufacturerPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Manufacturer: register a batch</h1>
      <ConnectButton />
      <NewBatchForm />
    </main>
  );
}
