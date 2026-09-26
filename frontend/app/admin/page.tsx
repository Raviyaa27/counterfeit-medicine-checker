import { BatchAdmin } from "@/components/BatchAdmin";
import { ConnectButton } from "@/components/ConnectButton";
import { ParticipantList } from "@/components/ParticipantList";
import { RegisterParticipantForm } from "@/components/RegisterParticipantForm";

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 p-4 sm:p-6">
      <h1 className="text-2xl font-bold">NMRA: regulator dashboard</h1>
      <ConnectButton />
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Register a participant</h2>
        <RegisterParticipantForm />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Registered participants</h2>
        <ParticipantList />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Batches</h2>
        <BatchAdmin />
      </section>
    </main>
  );
}
