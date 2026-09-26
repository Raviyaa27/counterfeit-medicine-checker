import { VerifyResult } from "@/components/VerifyResult";

// The QR code on each pack opens: https://<our-site>/verify?s=0x<32 hex characters>
type Props = { searchParams: Promise<{ s?: string }> };

export default async function VerifyPage({ searchParams }: Props) {
  const { s } = await searchParams;
  const valid = typeof s === "string" && /^0x[0-9a-fA-F]{32}$/.test(s);

  return (
    <main className="mx-auto w-full max-w-md p-4 sm:p-6">
      <h1 className="text-2xl font-bold">Medicine check</h1>
      {valid ? <VerifyResult serial={s as `0x${string}`} /> : <p className="mt-6 text-lg">Invalid or missing code. Scan the QR code on the pack again.</p>}
    </main>
  );
}
