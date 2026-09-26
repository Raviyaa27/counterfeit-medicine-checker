import Link from "next/link";

const STEPS = [
  { title: "Scan", text: "Scan the QR code printed on the medicine pack with your phone camera." },
  { title: "Read", text: "The page opens and checks the pack against the blockchain. No app or wallet needed." },
  { title: "Decide", text: "Green means genuine. Amber means already sold or not yet approved: check with your pharmacist. Red or NOT FOUND means do not use it." },
];

const ROLES = [
  { href: "/manufacturer", title: "Manufacturer", text: "Register a batch and print one QR code per pack." },
  { href: "/supply", title: "Supply chain", text: "Ship batches to distributors and pharmacies, and view the custody trail." },
  { href: "/pharmacy", title: "Pharmacy", text: "Mark a pack as sold, so a copied code is caught." },
  { href: "/admin", title: "NMRA regulator", text: "Register participants, approve batches and issue recalls." },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-10 p-4 sm:p-6">
      <section className="space-y-3 pt-4">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Counterfeit Medicine Checker</h1>
        <p className="text-lg text-zinc-500">
          Patients scan the QR code on a medicine pack and instantly learn, from a tamper-proof
          blockchain record, whether it is genuine, already sold, recalled or fake.
        </p>
      </section>

      <section className="rounded-2xl border border-zinc-300 p-5">
        <h2 className="mb-4 text-xl font-semibold">How to check a medicine</h2>
        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                {i + 1}
              </span>
              <p>
                <strong>{s.title}.</strong> {s.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">For people in the supply chain</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((r) => (
            <Link key={r.href} href={r.href} className="rounded-xl border border-zinc-300 p-4 hover:border-blue-600">
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-zinc-500">{r.text}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
