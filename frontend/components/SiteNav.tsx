import Link from "next/link";

const LINKS = [
  { href: "/manufacturer", label: "Manufacturer" },
  { href: "/supply", label: "Supply chain" },
  { href: "/pharmacy", label: "Pharmacy" },
  { href: "/admin", label: "NMRA" },
];

export function SiteNav() {
  return (
    <header className="border-b border-zinc-300">
      <nav className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 sm:px-6">
        <Link href="/" className="mr-auto font-bold">
          Counterfeit Medicine Checker
        </Link>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm text-zinc-500 hover:underline">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
