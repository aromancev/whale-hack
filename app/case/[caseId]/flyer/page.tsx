/* eslint-disable @next/next/no-img-element */
import { HomeButton } from "@/components/home-button";
import {
  formatAddress,
  formatLostTime,
  formatValue,
  getPublicCase,
  getPublicCaseUrl,
} from "@/app/public-case/public-case-utils";
import { Cat, QrCode } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";

export default async function PublicCaseFlyerPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const [petCase, publicCaseUrl] = await Promise.all([
    getPublicCase(caseId),
    getPublicCaseUrl(caseId),
  ]);

  if (!petCase || !publicCaseUrl) {
    notFound();
  }

  const pet = petCase.pet;
  const petName = pet?.name?.trim() || "Missing cat";
  const photoUrl = pet?.photo_urls[0];
  const qrSvg = await QRCode.toString(publicCaseUrl, {
    type: "svg",
    margin: 1,
    width: 220,
    color: {
      dark: "#1f2937",
      light: "#ffffff",
    },
  });

  return (
    <main className="flyer-page min-h-svh bg-[#f7f3eb] px-4 py-5 text-[#1f2937] sm:px-6 sm:py-8">
      <div className="no-print mx-auto flex max-w-4xl items-center justify-between gap-3 pb-6">
        <HomeButton className="text-[#6b5b4a] ring-[#e7dccd] focus-visible:ring-[#b6a38f]/40" />
        <div className="flex items-center gap-3">
          <Link
            href={`/public-case/${caseId}`}
            className="inline-flex items-center justify-center rounded-full border border-[#d8cbb8] bg-white px-4 py-2 text-sm font-bold text-[#5b4c3e] transition hover:bg-[#faf7f1]"
          >
            Full case
          </Link>
          <Link
            href={`/case/${caseId}/flyer/pdf`}
            target="_blank"
            className="inline-flex items-center justify-center rounded-full bg-[#1f2937] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#111827]"
          >
            Download PDF
          </Link>
        </div>
      </div>

      <section className="print-sheet mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(31,41,55,0.12)]">
        <div className="flyer-layout grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,1.2fr)_18rem] md:p-10">
          <div className="flyer-main space-y-6">
            <div>
              <p className="flyer-heading text-5xl font-black uppercase tracking-[0.35em] text-[#b91c1c] sm:text-7xl">
                MISSING
              </p>
            </div>

            <div className="flyer-photo overflow-hidden rounded-[1.75rem] border border-[#e5dccf] bg-[#faf7f1]">
              {photoUrl ? (
                <div className="flyer-photo-frame flex h-[26rem] items-center justify-center p-4 sm:p-6">
                  <img
                    alt={`${petName} photo`}
                    className="max-h-full w-full rounded-[1.25rem] object-contain"
                    src={photoUrl}
                  />
                </div>
              ) : (
                <div className="flyer-photo-frame flex h-[26rem] flex-col items-center justify-center gap-3 text-[#9ca3af]">
                  <Cat className="size-24" />
                  <span className="text-sm font-black uppercase tracking-[0.3em]">
                    Photo unavailable
                  </span>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#6b7280]">
                Pet name
              </p>
              <h1 className="flyer-pet-name mt-2 text-3xl font-black tracking-tight text-[#111827] sm:text-4xl">
                {petName}
              </h1>
            </div>

            <dl className="flyer-facts grid gap-4 sm:grid-cols-2">
              <Fact label="Last seen" value={formatAddress(petCase.lost_place)} />
              <Fact label="Lost" value={formatLostTime(petCase.lost_time)} />
              <Fact label="Color" value={formatValue(pet?.color)} />
              <Fact label="Breed" value={formatValue(pet?.breed)} />
              <Fact label="Size" value={formatValue(pet?.size)} />
              <Fact label="Reward" value={petCase.reward || "Not listed"} />
            </dl>

            {pet?.unique_details?.trim() ? (
              <div className="flyer-notes rounded-[1.5rem] bg-[#f8fafc] p-5">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#6b7280]">
                  Distinguishing details
                </p>
                <p className="mt-3 text-base font-medium leading-7 text-[#111827]">
                  {pet.unique_details}
                </p>
              </div>
            ) : null}
          </div>

          <aside className="flyer-side flex flex-col gap-5 rounded-[1.75rem] border border-[#e5e7eb] bg-[#f9fafb] p-6">
            <div>
              <div className="flex items-center gap-2 text-[#374151]">
                <QrCode className="size-5" />
                <p className="text-sm font-black uppercase tracking-[0.25em]">
                  Scan to open case
                </p>
              </div>
              <div
                className="flyer-qr mt-4 rounded-[1.5rem] bg-white p-4 shadow-sm"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            </div>

            <div className="flyer-contact rounded-[1.5rem] bg-[#111827] p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-[#cbd5e1]">
                Contact
              </p>
              <p className="mt-3 text-2xl font-black">{petCase.owner.name}</p>
              <p className="mt-2 break-all text-base font-medium text-[#e5e7eb]">
                {petCase.owner.email}
              </p>
              {petCase.owner.phone_number ? (
                <p className="mt-2 text-base font-medium text-[#e5e7eb]">
                  {petCase.owner.phone_number}
                </p>
              ) : null}
            </div>

            <div className="flyer-help rounded-[1.5rem] border border-dashed border-[#d1d5db] p-4 text-sm font-medium leading-6 text-[#4b5563]">
              If you saw this cat, scan the code or use the contact details above.
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flyer-fact rounded-[1.25rem] border border-[#e5e7eb] p-4">
      <dt className="text-xs font-black uppercase tracking-[0.25em] text-[#6b7280]">
        {label}
      </dt>
      <dd className="mt-2 text-base font-semibold leading-7 text-[#111827]">
        {value}
      </dd>
    </div>
  );
}
